import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { clubs, matches, matchPlayerStats, players, standings, seasons } from '@regista/db'
import { and, eq, inArray, or, sql, sum } from 'drizzle-orm'

async function getClub(userId: string) {
    const [club] = await db.select().from(clubs).where(eq(clubs.userId, userId)).limit(1)
    return club ?? null
}

export default class StatsController {
    async clubStats({ auth, response }: HttpContext) {
        const club = await getClub(auth.userId)
        if (!club) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        // Get current season
        let seasonId: string | null = null
        if (club.divisionId) {
            const [season] = await db.select({ id: seasons.id }).from(seasons)
                .where(and(eq(seasons.divisionId, club.divisionId), eq(seasons.status, 'in_progress')))
                .limit(1)
            seasonId = season?.id ?? null
        }

        // Standing stats
        const [standing] = seasonId
            ? await db.select().from(standings)
                .where(and(eq(standings.seasonId, seasonId), eq(standings.clubId, club.id)))
                .limit(1)
            : [null]

        // Finished matches this season
        const finishedMatches = seasonId
            ? await db.select()
                .from(matches)
                .where(and(
                    eq(matches.seasonId, seasonId),
                    eq(matches.status, 'finished'),
                    or(eq(matches.homeClubId, club.id), eq(matches.awayClubId, club.id)),
                ))
            : []

        // Calculate clean sheets and biggest results
        let cleanSheets = 0
        let biggestWin = { opponent: '', score: '', diff: 0 }
        let biggestLoss = { opponent: '', score: '', diff: 0 }

        for (const m of finishedMatches) {
            const isHome = m.homeClubId === club.id
            const myScore = isHome ? m.homeScore ?? 0 : m.awayScore ?? 0
            const theirScore = isHome ? m.awayScore ?? 0 : m.homeScore ?? 0
            const diff = myScore - theirScore

            if (theirScore === 0) cleanSheets++

            if (diff > biggestWin.diff) {
                biggestWin = { opponent: isHome ? m.awayClubId : m.homeClubId, score: `${myScore}-${theirScore}`, diff }
            }
            if (diff < biggestLoss.diff) {
                biggestLoss = { opponent: isHome ? m.awayClubId : m.homeClubId, score: `${myScore}-${theirScore}`, diff }
            }
        }

        // Enrich opponent names for biggest results
        const opponentIds = [biggestWin.opponent, biggestLoss.opponent].filter(Boolean)
        const opponentClubs = opponentIds.length > 0
            ? await db.select({ id: clubs.id, name: clubs.name }).from(clubs).where(inArray(clubs.id, opponentIds))
            : []
        const opponentMap = new Map(opponentClubs.map((c) => [c.id, c.name]))

        // Top players (from match_player_stats for this club)
        const matchIds = finishedMatches.map((m) => m.id)
        let topScorer = null
        let topAssists = null
        let topRating = null

        if (matchIds.length > 0) {
            const playerAggs = await db
                .select({
                    playerId: matchPlayerStats.playerId,
                    totalGoals: sum(matchPlayerStats.goals),
                    totalAssists: sum(matchPlayerStats.assists),
                    avgRating: sql<number>`round(avg(${matchPlayerStats.rating})::numeric, 1)`,
                })
                .from(matchPlayerStats)
                .where(and(
                    inArray(matchPlayerStats.matchId, matchIds),
                    eq(matchPlayerStats.clubId, club.id),
                ))
                .groupBy(matchPlayerStats.playerId)

            // Get player names
            const pIds = playerAggs.map((p) => p.playerId)
            const playerRows = pIds.length > 0
                ? await db.select({ id: players.id, firstName: players.firstName, lastName: players.lastName })
                    .from(players).where(inArray(players.id, pIds))
                : []
            const pMap = new Map(playerRows.map((p) => [p.id, `${p.firstName} ${p.lastName}`]))

            const scorersSorted = [...playerAggs].sort((a, b) => Number(b.totalGoals ?? 0) - Number(a.totalGoals ?? 0))
            const assistsSorted = [...playerAggs].sort((a, b) => Number(b.totalAssists ?? 0) - Number(a.totalAssists ?? 0))
            const ratingSorted = [...playerAggs].sort((a, b) => Number(b.avgRating ?? 0) - Number(a.avgRating ?? 0))

            if (scorersSorted[0] && Number(scorersSorted[0].totalGoals ?? 0) > 0) {
                topScorer = { name: pMap.get(scorersSorted[0].playerId) ?? 'Unknown', goals: Number(scorersSorted[0].totalGoals) }
            }
            if (assistsSorted[0] && Number(assistsSorted[0].totalAssists ?? 0) > 0) {
                topAssists = { name: pMap.get(assistsSorted[0].playerId) ?? 'Unknown', assists: Number(assistsSorted[0].totalAssists) }
            }
            if (ratingSorted[0]) {
                topRating = { name: pMap.get(ratingSorted[0].playerId) ?? 'Unknown', avgRating: Number(ratingSorted[0].avgRating) }
            }
        }

        return response.ok({
            season: {
                played: standing?.played ?? 0,
                won: standing?.won ?? 0,
                drawn: standing?.drawn ?? 0,
                lost: standing?.lost ?? 0,
                goalsFor: standing?.goalsFor ?? 0,
                goalsAgainst: standing?.goalsAgainst ?? 0,
                goalDifference: standing?.goalDifference ?? 0,
                cleanSheets,
                biggestWin: biggestWin.diff > 0 ? { opponent: opponentMap.get(biggestWin.opponent) ?? 'Unknown', score: biggestWin.score } : null,
                biggestLoss: biggestLoss.diff < 0 ? { opponent: opponentMap.get(biggestLoss.opponent) ?? 'Unknown', score: biggestLoss.score } : null,
            },
            topPlayers: {
                topScorer,
                topAssists,
                topRating,
            },
        })
    }
}
