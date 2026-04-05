import { Worker, type Job } from 'bullmq'
import { bullmqRedis } from '#services/redis'
import { db } from '@regista/db'
import { matches, players, clubs, standings } from '@regista/db'
import { and, eq, lte } from 'drizzle-orm'
import { queueService } from '#services/queue'
import { MatchEngine } from '../match/match_engine.js'
import { ProgressionService } from '../match/progression_service.js'
import { TrainingService } from '../training/training_service.js'
import { NotificationService } from '../notifications/notification_service.js'
import { SeasonLifecycleService } from '../competition/season_lifecycle_service.js'
import { FATIGUE_RECOVERY_PER_CYCLE } from '@regista/shared'

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

        // Get standing position
        const standingPosition = 10 // Default; could query standings but keeping simple for now

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

async function updateStandings(match: typeof matches.$inferSelect) {
    if (match.homeScore === null || match.awayScore === null) return

    // Find the standing rows
    const [homeStanding] = await db.select().from(standings)
        .where(and(eq(standings.seasonId, match.seasonId), eq(standings.clubId, match.homeClubId)))
        .limit(1)
    const [awayStanding] = await db.select().from(standings)
        .where(and(eq(standings.seasonId, match.seasonId), eq(standings.clubId, match.awayClubId)))
        .limit(1)

    if (!homeStanding || !awayStanding) return

    const homeWin = match.homeScore > match.awayScore
    const draw = match.homeScore === match.awayScore
    const awayWin = match.awayScore > match.homeScore

    // Update home
    await db.update(standings).set({
        played: homeStanding.played + 1,
        won: homeStanding.won + (homeWin ? 1 : 0),
        drawn: homeStanding.drawn + (draw ? 1 : 0),
        lost: homeStanding.lost + (awayWin ? 1 : 0),
        goalsFor: homeStanding.goalsFor + match.homeScore,
        goalsAgainst: homeStanding.goalsAgainst + match.awayScore,
        goalDifference: homeStanding.goalDifference + match.homeScore - match.awayScore,
        points: homeStanding.points + (homeWin ? 3 : draw ? 1 : 0),
        homeWon: homeStanding.homeWon + (homeWin ? 1 : 0),
        homeDrawn: homeStanding.homeDrawn + (draw ? 1 : 0),
        homeLost: homeStanding.homeLost + (awayWin ? 1 : 0),
        form: updateForm(homeStanding.form, homeWin ? 'W' : draw ? 'D' : 'L'),
        updatedAt: new Date(),
    }).where(eq(standings.id, homeStanding.id))

    // Update away
    await db.update(standings).set({
        played: awayStanding.played + 1,
        won: awayStanding.won + (awayWin ? 1 : 0),
        drawn: awayStanding.drawn + (draw ? 1 : 0),
        lost: awayStanding.lost + (homeWin ? 1 : 0),
        goalsFor: awayStanding.goalsFor + match.awayScore,
        goalsAgainst: awayStanding.goalsAgainst + match.homeScore,
        goalDifference: awayStanding.goalDifference + match.awayScore - match.homeScore,
        points: awayStanding.points + (awayWin ? 3 : draw ? 1 : 0),
        awayWon: awayStanding.awayWon + (awayWin ? 1 : 0),
        awayDrawn: awayStanding.awayDrawn + (draw ? 1 : 0),
        awayLost: awayStanding.awayLost + (homeWin ? 1 : 0),
        form: updateForm(awayStanding.form, awayWin ? 'W' : draw ? 'D' : 'L'),
        updatedAt: new Date(),
    }).where(eq(standings.id, awayStanding.id))

    // Recalculate positions for the entire season
    await recalculatePositions(match.seasonId)
}

function updateForm(currentForm: string, result: string): string {
    return (currentForm + result).slice(-5)
}

async function recalculatePositions(seasonId: string) {
    const all = await db.select().from(standings)
        .where(eq(standings.seasonId, seasonId))

    // Sort: points desc, goal difference desc, goals for desc
    all.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference
        return b.goalsFor - a.goalsFor
    })

    for (let i = 0; i < all.length; i++) {
        if (all[i].position !== i + 1) {
            await db.update(standings).set({ position: i + 1 }).where(eq(standings.id, all[i].id))
        }
    }
}

async function applyFatigue(clubId: string) {
    // Increase fatigue by 15-25 for all players (match fatigue)
    const clubPlayers = await db.select({ id: players.id, fatigue: players.fatigue })
        .from(players).where(eq(players.clubId, clubId))

    for (const p of clubPlayers) {
        const newFatigue = Math.min(100, p.fatigue + 15 + Math.floor(Math.random() * 10))
        await db.update(players).set({ fatigue: newFatigue, updatedAt: new Date() })
            .where(eq(players.id, p.id))
    }
}

async function processInjuries(clubId: string) {
    const injured = await db.select({ id: players.id, remaining: players.injuryMatchesRemaining })
        .from(players).where(and(eq(players.clubId, clubId), eq(players.isInjured, true)))

    for (const p of injured) {
        const newRemaining = Math.max(0, p.remaining - 1)
        await db.update(players).set({
            injuryMatchesRemaining: newRemaining,
            isInjured: newRemaining > 0,
            injuryType: newRemaining > 0 ? undefined : null,
            updatedAt: new Date(),
        }).where(eq(players.id, p.id))
    }
}

async function processSuspensions(clubId: string) {
    // Decrement suspension
    const suspended = await db.select({ id: players.id, remaining: players.suspensionMatchesRemaining })
        .from(players).where(and(eq(players.clubId, clubId), eq(players.isSuspended, true)))

    for (const p of suspended) {
        const newRemaining = Math.max(0, p.remaining - 1)
        await db.update(players).set({
            suspensionMatchesRemaining: newRemaining,
            isSuspended: newRemaining > 0,
            updatedAt: new Date(),
        }).where(eq(players.id, p.id))
    }

    // Check yellow card accumulation (5 yellows = 1 match ban)
    const yellowRisk = await db.select({ id: players.id, yellows: players.yellowCardsSeason })
        .from(players).where(and(eq(players.clubId, clubId), eq(players.isSuspended, false)))

    for (const p of yellowRisk) {
        if (p.yellows >= 5 && p.yellows % 5 === 0) {
            await db.update(players).set({
                isSuspended: true,
                suspensionMatchesRemaining: 1,
                updatedAt: new Date(),
            }).where(eq(players.id, p.id))
        }
    }
}

async function applyFatigueRecovery(clubId: string) {
    const clubPlayers = await db.select({ id: players.id, fatigue: players.fatigue })
        .from(players).where(eq(players.clubId, clubId))

    for (const p of clubPlayers) {
        const newFatigue = Math.max(0, p.fatigue - FATIGUE_RECOVERY_PER_CYCLE)
        if (newFatigue !== p.fatigue) {
            await db.update(players).set({ fatigue: newFatigue, updatedAt: new Date() })
                .where(eq(players.id, p.id))
        }
    }
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
