import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { clubs, matches, matchEvents, matchLineups, matchStats, matchTacticalChanges, players } from '@regista/db'
import { asc, eq } from 'drizzle-orm'

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
