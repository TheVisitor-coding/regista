import { db } from '@regista/db'
import { players } from '@regista/db'
import { and, eq } from 'drizzle-orm'
import {
    FORMATIONS,
    AI_PROFILE_FORMATIONS,
    FORMATION_POSITION_ALIASES,
    POSITION_TO_LINE,
    type PlayerPosition,
} from '@regista/shared'

interface PlayerCandidate {
    id: string
    position: PlayerPosition
    secondaryPositions: string[]
    overall: number
    fatigue: number
    isInjured: boolean
    isSuspended: boolean
}

function positionCompatibility(candidate: PlayerCandidate, targetPos: string): number {
    if (candidate.position === targetPos) return 1.0
    if (candidate.secondaryPositions.includes(targetPos)) return 0.85

    // Check aliases (RM→RW/CM, LM→LW/CM)
    const aliases = FORMATION_POSITION_ALIASES[targetPos]
    if (aliases) {
        if (aliases.includes(candidate.position)) return 0.85
        if (candidate.secondaryPositions.some((p) => aliases.includes(p))) return 0.75
    }

    // Same line bonus
    const candidateLine = POSITION_TO_LINE[candidate.position]
    const targetLine = POSITION_TO_LINE[targetPos as PlayerPosition] ??
        (targetPos === 'RM' || targetPos === 'LM' ? 'MID' : undefined)
    if (candidateLine && candidateLine === targetLine) return 0.7

    return 0.3
}

function effectiveOverall(candidate: PlayerCandidate, targetPos: string): number {
    const compat = positionCompatibility(candidate, targetPos)
    const fatigueModifier = 1 - candidate.fatigue / 200
    return candidate.overall * compat * fatigueModifier
}

export class AutoLineupService {
    static async getEligiblePlayers(clubId: string): Promise<PlayerCandidate[]> {
        const rows = await db
            .select({
                id: players.id,
                position: players.position,
                secondaryPositions: players.secondaryPositions,
                overall: players.overall,
                fatigue: players.fatigue,
                isInjured: players.isInjured,
                isSuspended: players.isSuspended,
            })
            .from(players)
            .where(
                and(
                    eq(players.clubId, clubId),
                    eq(players.isInjured, false),
                    eq(players.isSuspended, false),
                ),
            )

        return rows as PlayerCandidate[]
    }

    static selectFormation(eligible: PlayerCandidate[], aiProfile?: string): string {
        const preferred = aiProfile
            ? AI_PROFILE_FORMATIONS[aiProfile] ?? ['4-4-2']
            : ['4-4-2']

        for (const formation of preferred) {
            const positions = FORMATIONS[formation]
            if (!positions) continue

            // Check if we have enough players for each position slot
            const pool = [...eligible]
            let canFill = true

            for (const pos of positions) {
                const bestIdx = pool.findIndex((p) => positionCompatibility(p, pos) >= 0.3)
                if (bestIdx === -1) {
                    canFill = false
                    break
                }
                pool.splice(bestIdx, 1)
            }

            if (canFill) return formation
        }

        return '4-4-2' // fallback
    }

    static selectStartingXI(
        eligible: PlayerCandidate[],
        formation: string,
    ): Array<{ playerId: string; position: string }> {
        const positions = FORMATIONS[formation] ?? FORMATIONS['4-4-2']
        const pool = [...eligible]
        const xi: Array<{ playerId: string; position: string }> = []

        for (const pos of positions) {
            // Sort pool by effective overall for this position
            pool.sort((a, b) => effectiveOverall(b, pos) - effectiveOverall(a, pos))

            if (pool.length === 0) break

            const best = pool[0]
            xi.push({ playerId: best.id, position: pos })
            pool.splice(0, 1)
        }

        return xi
    }

    static selectBench(
        eligible: PlayerCandidate[],
        startingXIIds: Set<string>,
    ): Array<{ playerId: string; position: string }> {
        const remaining = eligible.filter((p) => !startingXIIds.has(p.id))
        const bench: Array<{ playerId: string; position: string }> = []

        // 1. Mandatory backup GK
        const gkIdx = remaining.findIndex((p) => p.position === 'GK')
        if (gkIdx !== -1) {
            bench.push({ playerId: remaining[gkIdx].id, position: 'GK' })
            remaining.splice(gkIdx, 1)
        }

        // 2. Fill remaining 6 spots by best overall, ensuring position diversity
        remaining.sort((a, b) => b.overall - a.overall)

        const linesNeeded = new Set(['DEF', 'MID', 'ATT'])
        const linesAdded = new Set<string>()

        for (const player of remaining) {
            if (bench.length >= 7) break
            const line = POSITION_TO_LINE[player.position]
            if (line && linesNeeded.has(line) && !linesAdded.has(line)) {
                bench.push({ playerId: player.id, position: player.position })
                linesAdded.add(line)
            }
        }

        // Fill remaining spots
        for (const player of remaining) {
            if (bench.length >= 7) break
            if (!bench.find((b) => b.playerId === player.id)) {
                bench.push({ playerId: player.id, position: player.position })
            }
        }

        return bench
    }
}
