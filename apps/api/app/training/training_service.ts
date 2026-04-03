import { db } from '@regista/db'
import { players, playerStats, goalkeeperStats, trainingPrograms } from '@regista/db'
import { eq } from 'drizzle-orm'
import {
    TRAINING_FOCUS_STATS,
    GK_TRAINING_FOCUS_STATS,
    TRAINING_FATIGUE_COST,
    TRAINING_BASE_GAIN,
    POSITION_TO_LINE,
    type PlayerPosition,
} from '@regista/shared'

export class TrainingService {
    /**
     * Apply one training session to all eligible players of a club.
     * Injured players are skipped. Fatigue is added/reduced based on focus.
     */
    static async applyTraining(clubId: string): Promise<number> {
        // Get training program
        const [program] = await db
            .select()
            .from(trainingPrograms)
            .where(eq(trainingPrograms.clubId, clubId))
            .limit(1)

        // Default program if none set
        const gkFocus = program?.gkFocus ?? 'reflexes'
        const defFocus = program?.defFocus ?? 'defensive'
        const midFocus = program?.midFocus ?? 'technical'
        const attFocus = program?.attFocus ?? 'technical'
        const overrides = (program?.individualOverrides ?? {}) as Record<string, string>

        // Get all club players
        const clubPlayers = await db
            .select()
            .from(players)
            .where(eq(players.clubId, clubId))

        let trained = 0

        for (const player of clubPlayers) {
            // Skip injured
            if (player.isInjured) continue

            const position = player.position as PlayerPosition
            const line = POSITION_TO_LINE[position]

            // Determine focus
            let focus: string
            if (overrides[player.id]) {
                focus = overrides[player.id]
            } else if (position === 'GK') {
                focus = gkFocus
            } else if (line === 'DEF') {
                focus = defFocus
            } else if (line === 'MID') {
                focus = midFocus
            } else {
                focus = attFocus
            }

            // Apply fatigue change
            const fatigueCost = TRAINING_FATIGUE_COST[focus] ?? 0
            const newFatigue = Math.max(0, Math.min(100, player.fatigue + fatigueCost))
            await db.update(players).set({ fatigue: newFatigue, updatedAt: new Date() }).where(eq(players.id, player.id))

            // Skip stat gains if rest
            if (focus === 'rest') {
                trained++
                continue
            }

            // Apply stat gains
            if (position === 'GK' && GK_TRAINING_FOCUS_STATS[focus]) {
                const targetStats = GK_TRAINING_FOCUS_STATS[focus]
                const [gkStats] = await db.select().from(goalkeeperStats).where(eq(goalkeeperStats.playerId, player.id)).limit(1)
                if (gkStats) {
                    const updates: Record<string, number> = {}
                    for (const stat of targetStats) {
                        const current = (gkStats as any)[stat] ?? 50
                        const cap = player.potential + 5
                        if (current < cap) {
                            updates[stat] = Math.min(cap, current + TRAINING_BASE_GAIN + Math.random() * 0.2)
                        }
                    }
                    if (Object.keys(updates).length > 0) {
                        await db.update(goalkeeperStats).set(updates as any).where(eq(goalkeeperStats.playerId, player.id))
                    }
                }
            } else if (TRAINING_FOCUS_STATS[focus]) {
                const targetStats = TRAINING_FOCUS_STATS[focus]
                const [stats] = await db.select().from(playerStats).where(eq(playerStats.playerId, player.id)).limit(1)
                if (stats) {
                    const updates: Record<string, number> = {}
                    for (const stat of targetStats) {
                        const current = (stats as any)[stat] ?? 50
                        const cap = player.potential + 5
                        if (current < cap) {
                            updates[stat] = Math.min(cap, current + TRAINING_BASE_GAIN + Math.random() * 0.2)
                        }
                    }
                    if (Object.keys(updates).length > 0) {
                        await db.update(playerStats).set(updates as any).where(eq(playerStats.playerId, player.id))
                    }
                }
            }

            trained++
        }

        return trained
    }
}
