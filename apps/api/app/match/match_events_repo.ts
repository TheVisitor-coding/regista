import { db } from '@regista/db'
import { matchEvents, matchStats, matchPlayerStats, matches } from '@regista/db'
import { eq } from 'drizzle-orm'
import type { MatchEvent } from '@regista/shared'
import type { TeamState } from './match_state.js'

export class MatchEventsRepo {
    static async insertEvents(events: MatchEvent[]) {
        if (events.length === 0) return

        await db.insert(matchEvents).values(
            events.map((e) => ({
                matchId: e.matchId,
                minute: e.minute,
                type: e.type as any,
                clubId: e.clubId ?? null,
                playerId: e.playerId ?? null,
                secondaryPlayerId: e.secondaryPlayerId ?? null,
                zone: (e.zone as any) ?? null,
                outcome: e.outcome as any,
                metadata: e.metadata ?? null,
            })),
        )
    }

    static async updateMatchScore(matchId: string, homeScore: number, awayScore: number) {
        await db
            .update(matches)
            .set({ homeScore, awayScore })
            .where(eq(matches.id, matchId))
    }

    static async updateMatchStatus(matchId: string, status: string, extra?: { startedAt?: Date; finishedAt?: Date }) {
        await db
            .update(matches)
            .set({
                status: status as any,
                ...extra,
            })
            .where(eq(matches.id, matchId))
    }

    static async saveTeamStats(matchId: string, team: TeamState, totalMinutes: number) {
        const otherPoss = totalMinutes - team.possessionMinutes
        const totalPoss = team.possessionMinutes + otherPoss
        const possessionPct = totalPoss > 0 ? (team.possessionMinutes / totalPoss) * 100 : 50

        await db.insert(matchStats).values({
            matchId,
            clubId: team.clubId,
            possession: Math.round(possessionPct * 10) / 10,
            shots: team.shotsTotal,
            shotsOnTarget: team.shotsOnTarget,
            passes: 0,
            passAccuracy: 0,
            fouls: team.fouls,
            corners: team.corners,
            yellowCards: team.yellowCards,
            redCards: team.redCards,
            saves: team.saves,
            tackles: 0,
            interceptions: 0,
        })
    }

    static async savePlayerStats(
        matchId: string,
        team: TeamState,
        lastMinute: number,
    ) {
        // Save stats for all players who were on the pitch

        for (const player of team.onPitch) {
            await db.insert(matchPlayerStats).values({
                matchId,
                playerId: player.playerId,
                clubId: team.clubId,
                minutesPlayed: lastMinute,
                goals: 0,
                assists: 0,
                shots: 0,
                shotsOnTarget: 0,
                passes: 0,
                tackles: 0,
                foulsCommitted: 0,
                yellowCards: player.yellowCards,
                redCard: player.isOut && player.yellowCards >= 2,
                rating: 6.0 + Math.random() * 2,
                fatigueStart: 0,
                fatigueEnd: Math.round(player.fatigue),
            })
        }
    }
}
