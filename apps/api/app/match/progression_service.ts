import { db } from '@regista/db'
import { players, playerStats, goalkeeperStats, matchPlayerStats } from '@regista/db'
import { eq } from 'drizzle-orm'

const FIELD_STATS = [
    'pace', 'stamina', 'strength', 'agility',
    'passing', 'shooting', 'dribbling', 'crossing', 'heading',
    'vision', 'composure', 'workRate', 'positioning',
    'tackling', 'marking', 'penalties', 'freeKick',
]

const GK_STATS = ['reflexes', 'diving', 'handling', 'positioning', 'kicking', 'communication']

function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

/**
 * Age-based progression modifier.
 * Young players progress faster, older players slower.
 */
function ageModifier(age: number): number {
    if (age <= 21) return 1.3
    if (age <= 24) return 1.1
    if (age <= 28) return 1.0
    if (age <= 31) return 0.7
    return 0.4
}

/**
 * Role-based modifier for passive progression.
 */
function roleModifier(minutesPlayed: number, _isStarter: boolean, age: number): number {
    let mod = 1.0

    // Regular starter: played ≥ 60 min
    if (minutesPlayed >= 60) {
        mod *= 1.2
    } else if (minutesPlayed >= 30) {
        // Substitute
        mod *= 0.7
    } else if (minutesPlayed > 0) {
        mod *= 0.5
    } else {
        // Unused
        mod *= 0.3
    }

    // Young integrated bonus
    if (age <= 21 && minutesPlayed >= 60) {
        mod *= 1.3
    }

    return mod
}

export class ProgressionService {
    /**
     * Apply passive post-match progression to all players of a club.
     * Each player gets +0.1-0.3 on 1-2 random stats, modified by role and age.
     */
    static async applyPassiveProgression(clubId: string, _matchId: string): Promise<number> {
        const clubPlayers = await db.select().from(players).where(eq(players.clubId, clubId))

        let progressed = 0

        for (const player of clubPlayers) {
            // Get match participation
            const [matchStats] = await db
                .select()
                .from(matchPlayerStats)
                .where(eq(matchPlayerStats.playerId, player.id))
                .limit(1)

            const minutesPlayed = matchStats?.minutesPlayed ?? 0
            const ageMod = ageModifier(player.age)
            const roleMod = roleModifier(minutesPlayed, minutesPlayed >= 60, player.age)
            const totalMod = ageMod * roleMod

            if (totalMod < 0.1) continue // Too small to matter

            // Determine number of stats to boost (1-2)
            const statsCount = Math.random() < 0.4 ? 2 : 1

            if (player.position === 'GK') {
                const [gkStats] = await db.select().from(goalkeeperStats).where(eq(goalkeeperStats.playerId, player.id)).limit(1)
                if (!gkStats) continue

                const updates: Record<string, number> = {}
                for (let i = 0; i < statsCount; i++) {
                    const stat = pickRandom(GK_STATS)
                    const current = (gkStats as any)[stat] ?? 50
                    const cap = player.potential + 5
                    if (current < cap) {
                        const gain = (0.1 + Math.random() * 0.2) * totalMod
                        updates[stat] = Math.min(cap, current + gain)
                    }
                }
                if (Object.keys(updates).length > 0) {
                    await db.update(goalkeeperStats).set(updates as any).where(eq(goalkeeperStats.playerId, player.id))
                    progressed++
                }
            } else {
                const [stats] = await db.select().from(playerStats).where(eq(playerStats.playerId, player.id)).limit(1)
                if (!stats) continue

                const updates: Record<string, number> = {}
                for (let i = 0; i < statsCount; i++) {
                    const stat = pickRandom(FIELD_STATS)
                    const current = (stats as any)[stat] ?? 50
                    const cap = player.potential + 5
                    if (current < cap) {
                        const gain = (0.1 + Math.random() * 0.2) * totalMod
                        updates[stat] = Math.min(cap, current + gain)
                    }
                }
                if (Object.keys(updates).length > 0) {
                    await db.update(playerStats).set(updates as any).where(eq(playerStats.playerId, player.id))
                    progressed++
                }
            }
        }

        return progressed
    }
}
