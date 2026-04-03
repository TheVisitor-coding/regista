import { db } from '@regista/db'
import { clubs, players, playerStats, goalkeeperStats, matchLineups, matches } from '@regista/db'
import { and, eq, inArray } from 'drizzle-orm'
import type { MatchState, TeamState, PlayerState } from './match_state.js'
import { simulateMinute } from './match_minute_simulator.js'
import { addedTimeMinutes } from './match_probability.js'
import { MatchEventsRepo } from './match_events_repo.js'
import { AiTacticsService } from './ai_tactics_service.js'
import { AutoLineupService } from './auto_lineup_service.js'
import { LineupService } from './lineup_service.js'

// Re-export for convenience
export type { MatchState } from './match_state.js'

async function loadTeamState(matchId: string, clubId: string): Promise<TeamState> {
    const [club] = await db
        .select({ id: clubs.id, isAi: clubs.isAi, aiProfile: clubs.aiProfile })
        .from(clubs)
        .where(eq(clubs.id, clubId))
        .limit(1)

    // Load lineup
    const lineupRows = await db
        .select()
        .from(matchLineups)
        .where(and(eq(matchLineups.matchId, matchId), eq(matchLineups.clubId, clubId)))

    const playerIds = lineupRows.map((l) => l.playerId)

    // Load player data
    const playerRows = playerIds.length > 0
        ? await db.select().from(players).where(inArray(players.id, playerIds))
        : []

    const statRows = playerIds.length > 0
        ? await db.select().from(playerStats).where(inArray(playerStats.playerId, playerIds))
        : []

    const gkStatRows = playerIds.length > 0
        ? await db.select().from(goalkeeperStats).where(inArray(goalkeeperStats.playerId, playerIds))
        : []

    const playerMap = new Map(playerRows.map((p) => [p.id, p]))
    const statMap = new Map(statRows.map((s) => [s.playerId, s]))
    const gkStatMap = new Map(gkStatRows.map((s) => [s.playerId, s]))

    function toPlayerState(lineupEntry: typeof lineupRows[0]): PlayerState {
        const p = playerMap.get(lineupEntry.playerId)
        const s = statMap.get(lineupEntry.playerId)
        const gk = gkStatMap.get(lineupEntry.playerId)

        return {
            playerId: lineupEntry.playerId,
            position: lineupEntry.position,
            overall: p?.overall ?? 50,
            fatigue: p?.fatigue ?? 0,
            yellowCards: 0,
            isOut: false,
            shooting: s?.shooting ?? 40,
            passing: s?.passing ?? 40,
            vision: s?.vision ?? 40,
            tackling: s?.tackling ?? 40,
            dribbling: s?.dribbling ?? 40,
            composure: s?.composure ?? 40,
            workRate: s?.workRate ?? 40,
            stamina: s?.stamina ?? 40,
            pace: s?.pace ?? 40,
            heading: s?.heading ?? 40,
            crossing: s?.crossing ?? 40,
            marking: s?.marking ?? 40,
            reflexes: gk?.reflexes ?? 20,
            diving: gk?.diving ?? 20,
        }
    }

    const starters = lineupRows.filter((l) => l.isStarter).map(toPlayerState)
    const bench = lineupRows.filter((l) => !l.isStarter).map(toPlayerState)

    const tactics = AiTacticsService.getDefaultTactics(club?.aiProfile ?? 'balanced')

    return {
        clubId,
        isAi: club?.isAi ?? false,
        aiProfile: club?.aiProfile ?? null,
        tactics,
        onPitch: starters,
        bench,
        score: 0,
        substitutionsUsed: 0,
        yellowCards: 0,
        redCards: 0,
        shotsTotal: 0,
        shotsOnTarget: 0,
        fouls: 0,
        corners: 0,
        saves: 0,
        possessionMinutes: 0,
    }
}

export class MatchEngine {
    static async simulateMatch(matchId: string): Promise<void> {
        // Load match
        const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)
        if (!match) throw new Error(`Match ${matchId} not found`)

        // Load teams
        const home = await loadTeamState(matchId, match.homeClubId)
        const away = await loadTeamState(matchId, match.awayClubId)

        const state: MatchState = {
            matchId,
            status: 'first_half',
            minute: 0,
            home,
            away,
            events: [],
            goalsFirstHalf: 0, cardsFirstHalf: 0, subsFirstHalf: 0, injuriesFirstHalf: 0,
            goalsSecondHalf: 0, cardsSecondHalf: 0, subsSecondHalf: 0, injuriesSecondHalf: 0,
        }

        // Update match status
        await MatchEventsRepo.updateMatchStatus(matchId, 'live', { startedAt: new Date() })

        // Kick-off event
        state.events.push({
            matchId, minute: 1, type: 'kick_off', outcome: 'neutral',
        })

        // First half: minutes 1-45
        for (let min = 1; min <= 45; min++) {
            state.minute = min
            const events = simulateMinute(state)
            state.events.push(...events)
        }

        // Added time first half
        const at1 = addedTimeMinutes(
            state.goalsFirstHalf, state.cardsFirstHalf,
            state.subsFirstHalf, state.injuriesFirstHalf,
        )
        for (let min = 46; min <= 45 + at1; min++) {
            state.minute = min
            const events = simulateMinute(state)
            state.events.push(...events)
        }

        // Half-time
        state.status = 'half_time'
        state.events.push({
            matchId, minute: 45 + at1, type: 'half_time_start', outcome: 'neutral',
        })

        // AI halftime decisions
        for (const team of [state.home, state.away]) {
            if (team.isAi) {
                const scoreDiff = team === state.home
                    ? state.home.score - state.away.score
                    : state.away.score - state.home.score

                const decision = AiTacticsService.makeDecision({
                    scoreDiff,
                    minute: 45,
                    substitutionsUsed: team.substitutionsUsed,
                    fatigueAvg: team.onPitch.reduce((s, p) => s + p.fatigue, 0) / team.onPitch.length,
                    yellowCards: team.yellowCards,
                    redCards: team.redCards,
                    currentMentality: team.tactics.mentality,
                    aiProfile: team.aiProfile ?? 'balanced',
                })

                if (decision.mentalityChange) {
                    team.tactics.mentality = decision.mentalityChange
                }
            }
        }

        state.events.push({
            matchId, minute: 45 + at1, type: 'half_time_end', outcome: 'neutral',
        })
        state.status = 'second_half'

        // Second half: minutes 46-90
        for (let min = 46; min <= 90; min++) {
            state.minute = min

            // AI decisions at 60 and 75
            if (min === 60 || min === 75) {
                for (const team of [state.home, state.away]) {
                    if (team.isAi) {
                        const scoreDiff = team === state.home
                            ? state.home.score - state.away.score
                            : state.away.score - state.home.score

                        const decision = AiTacticsService.makeDecision({
                            scoreDiff,
                            minute: min,
                            substitutionsUsed: team.substitutionsUsed,
                            fatigueAvg: team.onPitch.reduce((s, p) => s + p.fatigue, 0) / team.onPitch.length,
                            yellowCards: team.yellowCards,
                            redCards: team.redCards,
                            currentMentality: team.tactics.mentality,
                            aiProfile: team.aiProfile ?? 'balanced',
                        })

                        if (decision.mentalityChange) {
                            team.tactics.mentality = decision.mentalityChange
                        }
                    }
                }
            }

            const events = simulateMinute(state)
            state.events.push(...events)
        }

        // Added time second half
        const at2 = addedTimeMinutes(
            state.goalsSecondHalf, state.cardsSecondHalf,
            state.subsSecondHalf, state.injuriesSecondHalf,
        )
        for (let min = 91; min <= 90 + at2; min++) {
            state.minute = min
            const events = simulateMinute(state)
            state.events.push(...events)
        }

        // Full time
        state.status = 'finished'
        state.events.push({
            matchId, minute: 90 + at2, type: 'full_time', outcome: 'neutral',
        })

        // Persist everything
        await MatchEventsRepo.insertEvents(state.events)
        await MatchEventsRepo.updateMatchScore(matchId, state.home.score, state.away.score)
        await MatchEventsRepo.updateMatchStatus(matchId, 'finished', { finishedAt: new Date() })
        await MatchEventsRepo.saveTeamStats(matchId, state.home, state.minute)
        await MatchEventsRepo.saveTeamStats(matchId, state.away, state.minute)
        await MatchEventsRepo.savePlayerStats(matchId, state.home, state.minute)
        await MatchEventsRepo.savePlayerStats(matchId, state.away, state.minute)
    }

    /**
     * Prepare lineups for all clubs in a match.
     * For AI clubs: auto-select formation, XI, bench.
     * For human clubs without lineup: auto-fill.
     */
    static async prepareMatch(matchId: string): Promise<void> {
        const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1)
        if (!match) return

        for (const clubId of [match.homeClubId, match.awayClubId]) {
            // Check if lineup already exists
            const [existing] = await db
                .select({ id: matchLineups.id })
                .from(matchLineups)
                .where(and(eq(matchLineups.matchId, matchId), eq(matchLineups.clubId, clubId)))
                .limit(1)

            if (existing) continue // Already has lineup

            const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId)).limit(1)
            if (!club) continue

            const eligible = await AutoLineupService.getEligiblePlayers(clubId)
            const formation = AutoLineupService.selectFormation(eligible, club.aiProfile ?? undefined)
            const xi = AutoLineupService.selectStartingXI(eligible, formation)
            const xiIds = new Set(xi.map((p) => p.playerId))
            const bench = AutoLineupService.selectBench(eligible, xiIds)

            await LineupService.saveLineup(matchId, clubId, xi, bench)

            const tactics = AiTacticsService.getDefaultTactics(club.aiProfile ?? 'balanced')
            tactics.formation = formation
            await LineupService.saveTactics(matchId, clubId, tactics)
        }
    }
}
