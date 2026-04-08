import { Worker, type Job } from 'bullmq'
import { bullmqRedis } from '#services/redis'
import { db } from '@regista/db'
import { matches, clubs, standings } from '@regista/db'
import { and, eq, lte } from 'drizzle-orm'
import { queueService } from '#services/queue'
import { MatchEngine } from '../match/match_engine.js'
import { ProgressionService } from '../match/progression_service.js'
import { TrainingService } from '../training/training_service.js'
import { NotificationService } from '../notifications/notification_service.js'
import { SeasonLifecycleService } from '../competition/season_lifecycle_service.js'
import {
    updateStandings,
    applyFatigue,
    applyFatigueRecovery,
    processInjuries,
    processSuspensions,
} from '../match/post_match_service.js'

async function handlePreMatch(job: Job) {
    const { matchId } = job.data as { matchId: string }

    console.log(`⚽ Pre-match: preparing ${matchId}`)
    await MatchEngine.prepareMatch(matchId)

    // Enqueue simulation
    await queueService.enqueue('match', 'match:simulate', { matchId })
}

async function handleSimulate(job: Job) {
    const { matchId } = job.data as { matchId: string }

    console.log(`⚽ Simulating match ${matchId}`)
    await MatchEngine.simulateMatch(matchId)
    console.log(`⚽ Match ${matchId} finished`)

    // Enqueue post-processing
    await queueService.enqueue('match', 'match:post-process', { matchId })
}

async function handlePostProcess(job: Job) {
    const { matchId } = job.data as { matchId: string }

    console.log(`⚽ Post-processing match ${matchId}`)

    const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)
    if (!match || match.homeScore === null || match.awayScore === null) return

    // 1. Update standings
    await updateStandings(match)

    // 2. Apply fatigue to real player records
    await applyFatigue(match.homeClubId)
    await applyFatigue(match.awayClubId)

    // 3. Process match revenue (tickets, away revenue, match prime)
    const { FinanceService } = await import('../finances/finance_service.js')
    const { divisions } = await import('@regista/db')

    for (const clubId of [match.homeClubId, match.awayClubId]) {
        const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId)).limit(1)
        if (!club) continue

        const isHome = clubId === match.homeClubId
        const clubWon = isHome
            ? (match.homeScore ?? 0) > (match.awayScore ?? 0)
            : (match.awayScore ?? 0) > (match.homeScore ?? 0)
        const isDraw = match.homeScore === match.awayScore
        const result = clubWon ? 'win' as const : isDraw ? 'draw' as const : 'loss' as const

        // Get division level
        let divisionLevel = 3
        if (club.divisionId) {
            const [div] = await db.select({ level: divisions.level }).from(divisions).where(eq(divisions.id, club.divisionId)).limit(1)
            if (div) divisionLevel = div.level
        }

        // Get standing position (standings already recalculated in step 1)
        let standingPosition = 10
        const [standing] = await db.select({ position: standings.position })
            .from(standings)
            .where(and(eq(standings.seasonId, match.seasonId), eq(standings.clubId, clubId)))
            .limit(1)
        if (standing) standingPosition = standing.position

        await FinanceService.processMatchRevenue(clubId, match.id, isHome, result, divisionLevel, standingPosition)
    }

    // 4. Process injuries: decrement remaining matches
    await processInjuries(match.homeClubId)
    await processInjuries(match.awayClubId)

    // 5. Process suspensions: decrement remaining, check yellow accumulation
    await processSuspensions(match.homeClubId)
    await processSuspensions(match.awayClubId)

    // 6. Natural fatigue recovery (between matchdays)
    await applyFatigueRecovery(match.homeClubId)
    await applyFatigueRecovery(match.awayClubId)

    // 7. Passive progression
    await ProgressionService.applyPassiveProgression(match.homeClubId, matchId)
    await ProgressionService.applyPassiveProgression(match.awayClubId, matchId)

    // 8. Training session (for all clubs in the division, not just match participants)
    await TrainingService.applyTraining(match.homeClubId)
    await TrainingService.applyTraining(match.awayClubId)

    // 9. Send notifications to human clubs
    for (const clubId of [match.homeClubId, match.awayClubId]) {
        const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId)).limit(1)
        if (club && !club.isAi) {
            const isHome = clubId === match.homeClubId
            const score = isHome
                ? `${match.homeScore}-${match.awayScore}`
                : `${match.awayScore}-${match.homeScore}`
            const result = (isHome ? match.homeScore > match.awayScore : match.awayScore > match.homeScore)
                ? 'Victory' : (match.homeScore === match.awayScore ? 'Draw' : 'Defeat')

            await NotificationService.create(clubId, {
                staffRole: 'assistant',
                category: 'match',
                priority: 'info',
                title: `${result} ${score}`,
                message: `Matchday ${match.matchday} is over. ${result} ${score}.`,
                actionUrl: `/matches/${match.id}`,
            })
        }
    }

    // 10. Check if matchday is complete → advance season
    await SeasonLifecycleService.checkMatchdayComplete(match.seasonId)

    console.log(`⚽ Post-processing complete for ${matchId}`)
}

async function handleScheduler(_job: Job) {
    const now = new Date()
    const soon = new Date(now.getTime() + 15 * 60 * 1000)

    // Find all scheduled matches whose time has come (past or within next 15 min)
    const upcoming = await db.select({ id: matches.id, scheduledAt: matches.scheduledAt }).from(matches)
        .where(and(
            eq(matches.status, 'scheduled'),
            lte(matches.scheduledAt, soon),
        ))

    for (const match of upcoming) {
        await queueService.enqueue('match', 'match:pre-match', { matchId: match.id })
    }

    if (upcoming.length > 0) {
        console.log(`⚽ Scheduler: queued ${upcoming.length} matches for pre-match`)
    } else {
        console.log(`⚽ Scheduler: no matches to queue (checked at ${now.toISOString()})`)
    }
}

async function handleJob(job: Job) {
    switch (job.name) {
        case 'match:pre-match': return handlePreMatch(job)
        case 'match:simulate': return handleSimulate(job)
        case 'match:post-process': return handlePostProcess(job)
        case 'match:scheduler': return handleScheduler(job)
        default:
            console.warn(`Unknown match job: ${job.name}`)
    }
}

export function createMatchWorker() {
    const worker = new Worker('match', handleJob, {
        connection: bullmqRedis,
        concurrency: 3,
    })

    // Schedule match checker every 5 minutes
    queueService.enqueue('match', 'match:scheduler', {}, {
        repeat: { pattern: '*/5 * * * *' },
    })

    return worker
}
