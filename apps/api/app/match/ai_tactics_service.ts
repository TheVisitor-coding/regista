import { AI_PROFILE_TACTICS } from '@regista/shared'
import type { TacticConfig, Mentality } from '@regista/shared'

interface AIDecisionContext {
    scoreDiff: number // AI score - opponent score
    minute: number
    substitutionsUsed: number
    fatigueAvg: number
    yellowCards: number
    redCards: number
    currentMentality: Mentality
    aiProfile: string
}

interface AIDecision {
    mentalityChange?: Mentality
    substitutions: Array<{ playerOutId: string; playerInId: string; position: string }>
}

const MENTALITY_ORDER: Mentality[] = [
    'ultra_defensive', 'defensive', 'balanced', 'offensive', 'ultra_offensive',
]

function stepMentality(current: Mentality, direction: number): Mentality {
    const idx = MENTALITY_ORDER.indexOf(current)
    const newIdx = Math.max(0, Math.min(MENTALITY_ORDER.length - 1, idx + direction))
    return MENTALITY_ORDER[newIdx]
}

export class AiTacticsService {
    static getDefaultTactics(aiProfile: string): TacticConfig {
        const profile = AI_PROFILE_TACTICS[aiProfile] ?? AI_PROFILE_TACTICS.balanced
        return {
            formation: '4-4-2',
            mentality: profile.mentality as Mentality,
            pressing: profile.pressing as 'low' | 'medium' | 'high',
            passingStyle: profile.passingStyle as 'short' | 'mixed' | 'long',
            width: profile.width as 'narrow' | 'normal' | 'wide',
            tempo: profile.tempo as 'slow' | 'normal' | 'fast',
            defensiveLine: profile.defensiveLine as 'low' | 'medium' | 'high',
        }
    }

    static makeDecision(context: AIDecisionContext): AIDecision {
        const decision: AIDecision = { substitutions: [] }

        // Mentality adjustment rules
        if (context.scoreDiff <= -2 && context.minute >= 60) {
            decision.mentalityChange = 'ultra_offensive'
        } else if (context.scoreDiff === -1 && context.minute >= 75) {
            decision.mentalityChange = 'offensive'
        } else if (context.scoreDiff === -1 && context.minute < 75) {
            decision.mentalityChange = stepMentality(context.currentMentality, 1)
        } else if (context.scoreDiff >= 2) {
            decision.mentalityChange = 'defensive'
        } else if (context.scoreDiff === 1 && context.minute >= 75) {
            decision.mentalityChange = stepMentality(context.currentMentality, -1)
        }

        // Red card adjustment
        if (context.redCards >= 1 && context.scoreDiff > -2) {
            decision.mentalityChange = stepMentality(
                decision.mentalityChange ?? context.currentMentality,
                -1,
            )
        }

        return decision
    }

    static selectSubstitutions(
        context: AIDecisionContext,
        currentLineup: Array<{ playerId: string; position: string; fatigue: number; yellowCards: number }>,
        bench: Array<{ playerId: string; position: string; overall: number }>,
    ): Array<{ playerOutId: string; playerInId: string; position: string }> {
        const subs: Array<{ playerOutId: string; playerInId: string; position: string }> = []
        const maxSubs = context.minute >= 75 && context.scoreDiff < 0 ? 5 : 4
        const remainingSubs = maxSubs - context.substitutionsUsed
        const maxThisRound = context.minute === 45 ? 2 : context.minute === 75 ? 2 : 1
        const available = Math.min(remainingSubs, maxThisRound)

        if (available <= 0) return subs

        const usedBench = new Set<string>()
        const subbedOut = new Set<string>()

        // Priority 1: Fatigue >= 85
        for (const player of currentLineup) {
            if (subs.length >= available) break
            if (player.fatigue >= 85 && !subbedOut.has(player.playerId)) {
                const sub = bench.find((b) => !usedBench.has(b.playerId))
                if (sub) {
                    subs.push({ playerOutId: player.playerId, playerInId: sub.playerId, position: player.position })
                    usedBench.add(sub.playerId)
                    subbedOut.add(player.playerId)
                }
            }
        }

        // Priority 2: Yellow card + fatigue >= 70
        for (const player of currentLineup) {
            if (subs.length >= available) break
            if (player.yellowCards > 0 && player.fatigue >= 70 && !subbedOut.has(player.playerId)) {
                const sub = bench.find((b) => !usedBench.has(b.playerId))
                if (sub) {
                    subs.push({ playerOutId: player.playerId, playerInId: sub.playerId, position: player.position })
                    usedBench.add(sub.playerId)
                    subbedOut.add(player.playerId)
                }
            }
        }

        return subs
    }
}
