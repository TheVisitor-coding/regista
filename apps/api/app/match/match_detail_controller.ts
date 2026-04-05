import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { clubs, matches, matchEvents, matchLineups, matchStats, matchPlayerStats, matchTacticalChanges, players } from '@regista/db'
import { asc, desc, eq, inArray } from 'drizzle-orm'

async function getClubId(userId: string): Promise<string | null> {
    const [club] = await db.select({ id: clubs.id }).from(clubs).where(eq(clubs.userId, userId)).limit(1)
    return club?.id ?? null
}

export default class MatchDetailController {
    async events({ params, response }: HttpContext) {
        const events = await db
            .select()
            .from(matchEvents)
            .where(eq(matchEvents.matchId, params.matchId))
            .orderBy(asc(matchEvents.minute))

        return response.ok({
            events: events.map((e) => ({
                id: e.id,
                minute: e.minute,
                type: e.type,
                clubId: e.clubId,
                playerId: e.playerId,
                secondaryPlayerId: e.secondaryPlayerId,
                zone: e.zone,
                outcome: e.outcome,
                metadata: e.metadata,
                createdAt: e.createdAt.toISOString(),
            })),
        })
    }

    async lineups({ params, response }: HttpContext) {
        const lineups = await db
            .select({
                lineup: matchLineups,
                player: {
                    firstName: players.firstName,
                    lastName: players.lastName,
                    overall: players.overall,
                },
            })
            .from(matchLineups)
            .innerJoin(players, eq(matchLineups.playerId, players.id))
            .where(eq(matchLineups.matchId, params.matchId))
            .orderBy(asc(matchLineups.clubId), asc(matchLineups.isStarter))

        return response.ok({
            lineups: lineups.map((l) => ({
                id: l.lineup.id,
                clubId: l.lineup.clubId,
                playerId: l.lineup.playerId,
                playerName: `${l.player.firstName} ${l.player.lastName}`,
                playerOverall: l.player.overall,
                position: l.lineup.position,
                isStarter: l.lineup.isStarter,
                minuteIn: l.lineup.minuteIn,
                minuteOut: l.lineup.minuteOut,
                rating: l.lineup.rating,
            })),
        })
    }

    async stats({ params, response }: HttpContext) {
        const stats = await db
            .select()
            .from(matchStats)
            .where(eq(matchStats.matchId, params.matchId))

        return response.ok({
            stats: stats.map((s) => ({
                clubId: s.clubId,
                possession: s.possession,
                shots: s.shots,
                shotsOnTarget: s.shotsOnTarget,
                passes: s.passes,
                passAccuracy: s.passAccuracy,
                fouls: s.fouls,
                corners: s.corners,
                yellowCards: s.yellowCards,
                redCards: s.redCards,
                saves: s.saves,
            })),
        })
    }

    async summary({ auth, params, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)

        const [match] = await db.select().from(matches).where(eq(matches.id, params.matchId)).limit(1)
        if (!match) return response.notFound({ error: 'MATCH_NOT_FOUND' })

        // Get clubs
        const clubRows = await db.select({ id: clubs.id, name: clubs.name, primaryColor: clubs.primaryColor })
            .from(clubs).where(inArray(clubs.id, [match.homeClubId, match.awayClubId]))
        const clubMap = new Map(clubRows.map((c) => [c.id, c]))

        // Determine result for the user's club
        let result: 'win' | 'draw' | 'loss' | null = null
        if (clubId && match.homeScore !== null && match.awayScore !== null) {
            const isHome = match.homeClubId === clubId
            const myScore = isHome ? match.homeScore : match.awayScore
            const theirScore = isHome ? match.awayScore : match.homeScore
            result = myScore > theirScore ? 'win' : myScore === theirScore ? 'draw' : 'loss'
        }

        // Highlights (goals, cards, injuries)
        const events = await db.select().from(matchEvents)
            .where(eq(matchEvents.matchId, params.matchId))
            .orderBy(asc(matchEvents.minute))

        const highlights = events.filter((e) =>
            ['goal', 'yellow_card', 'red_card', 'injury', 'substitution', 'penalty'].includes(e.type),
        )

        // Enrich highlights with player names
        const playerIds = new Set<string>()
        for (const h of highlights) {
            if (h.playerId) playerIds.add(h.playerId)
            if (h.secondaryPlayerId) playerIds.add(h.secondaryPlayerId)
        }
        const playerRows = playerIds.size > 0
            ? await db.select({ id: players.id, firstName: players.firstName, lastName: players.lastName })
                .from(players).where(inArray(players.id, [...playerIds]))
            : []
        const playerNameMap = new Map(playerRows.map((p) => [p.id, `${p.firstName} ${p.lastName}`]))

        // Player ratings
        const playerStatsRows = await db.select({
            playerId: matchPlayerStats.playerId,
            clubId: matchPlayerStats.clubId,
            rating: matchPlayerStats.rating,
            minutesPlayed: matchPlayerStats.minutesPlayed,
            goals: matchPlayerStats.goals,
            assists: matchPlayerStats.assists,
        }).from(matchPlayerStats)
            .where(eq(matchPlayerStats.matchId, params.matchId))
            .orderBy(desc(matchPlayerStats.rating))

        // MOTM (highest rating)
        const motm = playerStatsRows[0]
        const motmPlayer = motm ? await db.select({ id: players.id, firstName: players.firstName, lastName: players.lastName })
            .from(players).where(eq(players.id, motm.playerId)).limit(1) : []

        // Generate assistant comment
        const assistantComment = generateComment(result, match.homeScore ?? 0, match.awayScore ?? 0, motmPlayer[0], motm)

        // Stats
        const stats = await db.select().from(matchStats).where(eq(matchStats.matchId, params.matchId))

        return response.ok({
            result,
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            homeClub: clubMap.get(match.homeClubId) ?? { id: match.homeClubId, name: 'Unknown', primaryColor: '#666' },
            awayClub: clubMap.get(match.awayClubId) ?? { id: match.awayClubId, name: 'Unknown', primaryColor: '#666' },
            matchday: match.matchday,
            motm: motm && motmPlayer[0] ? {
                playerId: motm.playerId,
                name: `${motmPlayer[0].firstName} ${motmPlayer[0].lastName}`,
                rating: motm.rating,
                goals: motm.goals,
                assists: motm.assists,
            } : null,
            highlights: highlights.map((h) => ({
                minute: h.minute,
                type: h.type,
                clubId: h.clubId,
                playerName: h.playerId ? playerNameMap.get(h.playerId) ?? null : null,
                secondaryPlayerName: h.secondaryPlayerId ? playerNameMap.get(h.secondaryPlayerId) ?? null : null,
            })),
            playerRatings: playerStatsRows.map((ps) => ({
                playerId: ps.playerId,
                clubId: ps.clubId,
                name: playerNameMap.get(ps.playerId) ?? 'Unknown',
                rating: ps.rating,
                minutesPlayed: ps.minutesPlayed,
                goals: ps.goals,
                assists: ps.assists,
            })),
            assistantComment,
            stats: stats.map((s) => ({
                clubId: s.clubId,
                possession: s.possession,
                shots: s.shots,
                shotsOnTarget: s.shotsOnTarget,
                fouls: s.fouls,
                corners: s.corners,
                yellowCards: s.yellowCards,
                redCards: s.redCards,
                saves: s.saves,
            })),
        })
    }

    async playerStatsDetail({ params, response }: HttpContext) {
        const rows = await db.select({
            ps: matchPlayerStats,
            player: { firstName: players.firstName, lastName: players.lastName, position: players.position },
        }).from(matchPlayerStats)
            .innerJoin(players, eq(matchPlayerStats.playerId, players.id))
            .where(eq(matchPlayerStats.matchId, params.matchId))
            .orderBy(desc(matchPlayerStats.rating))

        return response.ok({
            playerStats: rows.map((r) => ({
                playerId: r.ps.playerId,
                clubId: r.ps.clubId,
                name: `${r.player.firstName} ${r.player.lastName}`,
                position: r.player.position,
                minutesPlayed: r.ps.minutesPlayed,
                goals: r.ps.goals,
                assists: r.ps.assists,
                shots: r.ps.shots,
                shotsOnTarget: r.ps.shotsOnTarget,
                passes: r.ps.passes,
                tackles: r.ps.tackles,
                foulsCommitted: r.ps.foulsCommitted,
                yellowCards: r.ps.yellowCards,
                redCard: r.ps.redCard,
                rating: r.ps.rating,
                fatigueStart: r.ps.fatigueStart,
                fatigueEnd: r.ps.fatigueEnd,
            })),
        })
    }

    async updateTactics({ auth, params, request, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const [match] = await db.select().from(matches).where(eq(matches.id, params.matchId)).limit(1)
        if (!match) return response.notFound({ error: 'MATCH_NOT_FOUND' })
        if (match.status !== 'live') return response.badRequest({ error: 'MATCH_NOT_LIVE' })
        if (match.homeClubId !== clubId && match.awayClubId !== clubId) {
            return response.forbidden({ error: 'NOT_YOUR_MATCH' })
        }

        const data = request.all()

        await db.insert(matchTacticalChanges).values({
            matchId: params.matchId,
            clubId,
            minute: 0, // Will be set by engine
            formation: data.formation ?? null,
            mentality: data.mentality ?? null,
            pressing: data.pressing ?? null,
            passingStyle: data.passingStyle ?? null,
            width: data.width ?? null,
            tempo: data.tempo ?? null,
            defensiveLine: data.defensiveLine ?? null,
        })

        return response.ok({ success: true })
    }
}

function generateComment(
    result: 'win' | 'draw' | 'loss' | null,
    homeScore: number,
    awayScore: number,
    motmPlayer: { firstName: string; lastName: string } | undefined,
    motmStats: { rating: number; goals: number; assists: number } | undefined,
): string {
    const motmName = motmPlayer ? `${motmPlayer.firstName} ${motmPlayer.lastName}` : null
    const totalGoals = homeScore + awayScore
    const diff = Math.abs(homeScore - awayScore)

    if (!result) return 'Match summary available.'

    let comment = ''

    if (result === 'win') {
        if (diff >= 3) comment = 'Dominant victory! '
        else if (diff === 1) comment = 'Hard-fought win! '
        else comment = 'Solid victory! '
    } else if (result === 'draw') {
        if (totalGoals === 0) comment = 'A goalless draw. '
        else comment = 'A fair draw. '
    } else {
        if (diff >= 3) comment = 'A tough defeat to swallow. '
        else comment = 'A disappointing result. '
    }

    if (motmName && motmStats) {
        if (motmStats.goals > 1) {
            comment += `${motmName} was outstanding with ${motmStats.goals} goals. `
        } else if (motmStats.goals === 1) {
            comment += `${motmName} delivered a strong performance with a goal. `
        } else if (motmStats.rating >= 8.0) {
            comment += `${motmName} was the best player on the pitch (${motmStats.rating.toFixed(1)}). `
        }
    }

    return comment.trim()
}
