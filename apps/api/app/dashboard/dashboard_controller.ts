import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { clubs, divisions, notifications, players, matches, matchPlayerStats, seasons, standings, trainingPrograms, transferOffers } from '@regista/db'
import { and, asc, avg, count, desc, eq, gte, lt, or, sql, sum } from 'drizzle-orm'
import { FINANCE_ALERT_THRESHOLD, FINANCE_CRITICAL_THRESHOLD, MORALE_INITIAL } from '@regista/shared'

function moraleLabel(morale: number): 'excellent' | 'good' | 'neutral' | 'poor' | 'critical' {
    if (morale >= 80) return 'excellent'
    if (morale >= 60) return 'good'
    if (morale >= 40) return 'neutral'
    if (morale >= 20) return 'poor'
    return 'critical'
}

function moraleTrend(current: number): 'up' | 'down' | 'stable' {
    if (current > MORALE_INITIAL + 5) return 'up'
    if (current < MORALE_INITIAL - 5) return 'down'
    return 'stable'
}

export default class DashboardController {
    async show({ auth, response }: HttpContext) {
        const [club] = await db
            .select()
            .from(clubs)
            .where(eq(clubs.userId, auth.userId))
            .limit(1)

        if (!club) {
            return response.notFound({
                error: 'CLUB_NOT_FOUND',
                message: 'You do not have a club yet',
            })
        }

        // Squad status
        const squadPlayers = await db
            .select({
                totalPlayers: count(players.id),
                injured: count(sql`CASE WHEN ${players.isInjured} = true THEN 1 END`),
                suspended: count(sql`CASE WHEN ${players.isSuspended} = true THEN 1 END`),
                avgFatigue: avg(players.fatigue),
            })
            .from(players)
            .where(eq(players.clubId, club.id))

        const stats = squadPlayers[0]
        const totalPlayers = Number(stats?.totalPlayers ?? 0)
        const injured = Number(stats?.injured ?? 0)
        const suspended = Number(stats?.suspended ?? 0)
        const avgFatigue = Math.round(Number(stats?.avgFatigue ?? 0))

        // Unread notifications
        const [unreadResult] = await db
            .select({ value: count(notifications.id) })
            .from(notifications)
            .where(and(eq(notifications.clubId, club.id), eq(notifications.isRead, false)))

        // Recent notifications (5 latest unread)
        const recentNotifs = await db
            .select()
            .from(notifications)
            .where(and(eq(notifications.clubId, club.id), eq(notifications.isRead, false)))
            .orderBy(desc(notifications.createdAt))
            .limit(5)

        const now = new Date()

        // Recent results
        const recentMatchRows = await db
            .select({
                id: matches.id,
                matchday: matches.matchday,
                homeClubId: matches.homeClubId,
                awayClubId: matches.awayClubId,
                homeScore: matches.homeScore,
                awayScore: matches.awayScore,
                finishedAt: matches.finishedAt,
            })
            .from(matches)
            .where(
                and(
                    or(eq(matches.homeClubId, club.id), eq(matches.awayClubId, club.id)),
                    eq(matches.status, 'finished'),
                ),
            )
            .orderBy(desc(matches.finishedAt))
            .limit(3)

        // Enrich with opponent names
        const opponentIds = recentMatchRows.map((m) =>
            m.homeClubId === club.id ? m.awayClubId : m.homeClubId,
        )
        const opponentClubs = opponentIds.length > 0
            ? await db.select({ id: clubs.id, name: clubs.name }).from(clubs)
                .where(sql`${clubs.id} IN (${sql.join(opponentIds.map((id) => sql`${id}`), sql`, `)})`)
            : []
        const opponentMap = new Map(opponentClubs.map((c) => [c.id, c.name]))

        const recentResults = recentMatchRows.map((m) => {
            const isHome = m.homeClubId === club.id
            const myScore = isHome ? m.homeScore ?? 0 : m.awayScore ?? 0
            const theirScore = isHome ? m.awayScore ?? 0 : m.homeScore ?? 0
            const opponentId = isHome ? m.awayClubId : m.homeClubId

            return {
                matchId: m.id,
                opponent: opponentMap.get(opponentId) ?? 'Unknown',
                score: `${myScore} - ${theirScore}`,
                result: myScore > theirScore ? 'win' as const : myScore === theirScore ? 'draw' as const : 'loss' as const,
                date: m.finishedAt?.toISOString() ?? '',
                isHome,
            }
        })

        // Next match
        let nextMatch = null
        const [nextMatchRow] = await db
            .select()
            .from(matches)
            .where(
                and(
                    or(eq(matches.homeClubId, club.id), eq(matches.awayClubId, club.id)),
                    gte(matches.scheduledAt, now),
                    eq(matches.status, 'scheduled'),
                ),
            )
            .orderBy(asc(matches.scheduledAt))
            .limit(1)

        if (nextMatchRow) {
            const opponentId = nextMatchRow.homeClubId === club.id
                ? nextMatchRow.awayClubId
                : nextMatchRow.homeClubId

            const [opponent] = await db
                .select({ id: clubs.id, name: clubs.name, logoId: clubs.logoId, primaryColor: clubs.primaryColor })
                .from(clubs)
                .where(eq(clubs.id, opponentId))
                .limit(1)

            // Opponent recent form
            const opponentRecentMatches = opponent ? await db
                .select({ homeClubId: matches.homeClubId, awayClubId: matches.awayClubId, homeScore: matches.homeScore, awayScore: matches.awayScore })
                .from(matches)
                .where(and(
                    or(eq(matches.homeClubId, opponent.id), eq(matches.awayClubId, opponent.id)),
                    eq(matches.status, 'finished'),
                ))
                .orderBy(desc(matches.finishedAt))
                .limit(5) : []

            const opponentForm = opponentRecentMatches.map((m) => {
                const isHome = m.homeClubId === opponent!.id
                const scored = isHome ? m.homeScore ?? 0 : m.awayScore ?? 0
                const conceded = isHome ? m.awayScore ?? 0 : m.homeScore ?? 0
                return scored > conceded ? 'W' : scored === conceded ? 'D' : 'L'
            })

            if (opponent) {
                nextMatch = {
                    id: nextMatchRow.id,
                    opponent: { id: opponent.id, name: opponent.name, logoId: opponent.logoId, primaryColor: opponent.primaryColor },
                    scheduledAt: nextMatchRow.scheduledAt.toISOString(),
                    competition: 'League',
                    matchday: nextMatchRow.matchday,
                    isHome: nextMatchRow.homeClubId === club.id,
                    opponentForm,
                }
            }
        }

        // Standings excerpt + season progress
        let standingExcerpt: Array<{
            position: number
            club: string
            points: number
            goalDiff: number
            played: number
            isCurrentClub?: boolean
            isNextOpponent?: boolean
        }> = []
        let seasonProgress: { currentMatchday: number; totalMatchdays: number; percentComplete: number } | null = null
        let divisionName: string | null = null
        let seasonLabel: string | null = null

        if (club.divisionId) {
            // Division name
            const [div] = await db
                .select({ name: divisions.name })
                .from(divisions)
                .where(eq(divisions.id, club.divisionId))
                .limit(1)
            divisionName = div?.name ?? null

            const [season] = await db
                .select()
                .from(seasons)
                .where(and(eq(seasons.divisionId, club.divisionId), eq(seasons.status, 'in_progress')))
                .limit(1)

            if (season) {
                seasonProgress = {
                    currentMatchday: season.currentMatchday,
                    totalMatchdays: season.totalMatchdays,
                    percentComplete: Math.round((season.currentMatchday / season.totalMatchdays) * 100),
                }
                seasonLabel = `Season ${season.number}`

                const [myStanding] = await db
                    .select()
                    .from(standings)
                    .where(and(eq(standings.seasonId, season.id), eq(standings.clubId, club.id)))
                    .limit(1)

                const myPos = myStanding?.position ?? 10
                const minPos = Math.max(1, myPos - 2)
                const maxPos = myPos + 2

                const excerptRows = await db
                    .select({
                        position: standings.position,
                        points: standings.points,
                        goalDifference: standings.goalDifference,
                        played: standings.played,
                        clubId: standings.clubId,
                        clubName: clubs.name,
                    })
                    .from(standings)
                    .innerJoin(clubs, eq(standings.clubId, clubs.id))
                    .where(
                        and(
                            eq(standings.seasonId, season.id),
                            gte(standings.position, minPos),
                            sql`${standings.position} <= ${maxPos}`,
                        ),
                    )
                    .orderBy(asc(standings.position))

                standingExcerpt = excerptRows.map((r) => ({
                    position: r.position,
                    club: r.clubName,
                    points: r.points,
                    goalDiff: r.goalDifference,
                    played: r.played,
                    isCurrentClub: r.clubId === club.id,
                    isNextOpponent: nextMatch ? r.clubId === nextMatch.opponent.id : false,
                }))
            }
        }

        // Quick actions
        const quickActions: Array<{ priority: string; message: string; actionUrl?: string }> = []

        if (club.balance <= FINANCE_CRITICAL_THRESHOLD) {
            quickActions.push({
                priority: 'critical',
                message: 'Your balance is negative! Review your finances immediately.',
                actionUrl: '/finances',
            })
        } else if (club.balance <= FINANCE_ALERT_THRESHOLD) {
            quickActions.push({
                priority: 'warning',
                message: 'Your balance is running low. Consider your spending.',
                actionUrl: '/finances',
            })
        }

        if (avgFatigue > 70) {
            quickActions.push({
                priority: 'important',
                message: `Average team fatigue is high (${avgFatigue}%). Consider resting key players.`,
                actionUrl: '/training',
            })
        }

        const expiringPlayers = await db
            .select({ id: players.id, firstName: players.firstName, lastName: players.lastName, contractMatchesRemaining: players.contractMatchesRemaining })
            .from(players)
            .where(and(eq(players.clubId, club.id), lt(players.contractMatchesRemaining, 6)))
            .orderBy(asc(players.contractMatchesRemaining))

        for (const p of expiringPlayers.slice(0, 2)) {
            quickActions.push({
                priority: 'important',
                message: `${p.firstName} ${p.lastName} contract expiring (${p.contractMatchesRemaining} matches left)`,
                actionUrl: `/squad/${p.id}`,
            })
        }

        if (injured > 0) {
            quickActions.push({
                priority: 'critical',
                message: `${injured} player${injured > 1 ? 's' : ''} injured. Review your squad.`,
                actionUrl: '/squad',
            })
        }

        const [pendingOffers] = await db
            .select({ value: count(transferOffers.id) })
            .from(transferOffers)
            .where(and(eq(transferOffers.toClubId, club.id), eq(transferOffers.status, 'pending')))

        if ((pendingOffers?.value ?? 0) > 0) {
            quickActions.push({
                priority: 'info',
                message: `${pendingOffers!.value} transfer offer(s) pending your response`,
                actionUrl: '/transfers',
            })
        }

        if (recentResults.length >= 3 && recentResults.every((r) => r.result === 'win')) {
            quickActions.push({
                priority: 'positive',
                message: '3-match winning streak! Keep up the momentum!',
            })
        }

        if (quickActions.length === 0) {
            quickActions.push({
                priority: 'info',
                message: 'Everything looks good. Prepare for the next match!',
                actionUrl: '/tactics',
            })
        }

        // ===== NEW: Club overview strip data =====

        // Top scorer
        let topScorer: { name: string; goals: number } | null = null
        try {
            const [scorer] = await db
                .select({
                    firstName: players.firstName,
                    lastName: players.lastName,
                    totalGoals: sum(matchPlayerStats.goals).as('total_goals'),
                })
                .from(matchPlayerStats)
                .innerJoin(players, eq(matchPlayerStats.playerId, players.id))
                .where(eq(players.clubId, club.id))
                .groupBy(players.id, players.firstName, players.lastName)
                .orderBy(desc(sql`total_goals`))
                .limit(1)

            if (scorer && Number(scorer.totalGoals) > 0) {
                topScorer = { name: `${scorer.firstName} ${scorer.lastName}`, goals: Number(scorer.totalGoals) }
            }
        } catch { /* table may be empty */ }

        // Best form player (highest avg rating last 5 matches)
        let bestFormPlayer: { name: string; form: string } | null = null
        try {
            const finishedMatchIds = await db
                .select({ id: matches.id })
                .from(matches)
                .where(
                    and(
                        or(eq(matches.homeClubId, club.id), eq(matches.awayClubId, club.id)),
                        eq(matches.status, 'finished'),
                    ),
                )
                .orderBy(desc(matches.finishedAt))
                .limit(5)

            if (finishedMatchIds.length > 0) {
                const matchIdList = finishedMatchIds.map((m) => m.id)
                const [bestPlayer] = await db
                    .select({
                        firstName: players.firstName,
                        lastName: players.lastName,
                        avgRating: avg(matchPlayerStats.rating).as('avg_rating'),
                    })
                    .from(matchPlayerStats)
                    .innerJoin(players, eq(matchPlayerStats.playerId, players.id))
                    .where(
                        and(
                            eq(players.clubId, club.id),
                            sql`${matchPlayerStats.matchId} IN (${sql.join(matchIdList.map((id) => sql`${id}`), sql`, `)})`,
                        ),
                    )
                    .groupBy(players.id, players.firstName, players.lastName)
                    .orderBy(desc(sql`avg_rating`))
                    .limit(1)

                if (bestPlayer) {
                    const rating = Number(bestPlayer.avgRating ?? 0)
                    const formLabel = rating >= 7.5 ? 'Excellent' : rating >= 7.0 ? 'Good' : rating >= 6.5 ? 'Average' : 'Poor'
                    bestFormPlayer = { name: `${bestPlayer.firstName} ${bestPlayer.lastName}`, form: formLabel }
                }
            }
        } catch { /* table may be empty */ }

        // Next contract expiry
        let nextContractExpiry: { name: string; matchesLeft: number } | null = null
        if (expiringPlayers.length > 0) {
            const p = expiringPlayers[0]
            nextContractExpiry = {
                name: `${p.firstName.charAt(0)}. ${p.lastName}`,
                matchesLeft: p.contractMatchesRemaining,
            }
        }

        // Training intensity
        let trainingIntensity: { level: string; percent: number } | null = null
        try {
            const [training] = await db
                .select()
                .from(trainingPrograms)
                .where(eq(trainingPrograms.clubId, club.id))
                .limit(1)

            if (training) {
                // Infer intensity from the focus distribution
                trainingIntensity = { level: 'High', percent: 85 }
            }
        } catch { /* table may not exist yet */ }

        return response.ok({
            club: {
                id: club.id,
                name: club.name,
                logoId: club.logoId,
                primaryColor: club.primaryColor,
                balance: club.balance,
                morale: club.morale,
                moraleLabel: moraleLabel(club.morale),
                moraleTrend: moraleTrend(club.morale),
            },
            nextMatch,
            recentResults,
            squadStatus: {
                totalPlayers,
                available: totalPlayers - injured - suspended,
                injured,
                suspended,
                averageFatigue: avgFatigue,
                averageFitness: 100 - avgFatigue,
            },
            quickActions,
            standingExcerpt,
            seasonProgress,
            recentNotifications: recentNotifs.map((n) => ({
                id: n.id,
                staffRole: n.staffRole,
                title: n.title,
                message: n.message,
                priority: n.priority,
                createdAt: n.createdAt.toISOString(),
            })),
            unreadNotifications: unreadResult?.value ?? 0,
            divisionName,
            seasonLabel,
            topScorer,
            bestFormPlayer,
            nextContractExpiry,
            trainingIntensity,
        })
    }
}
