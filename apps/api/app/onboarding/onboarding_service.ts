import { db } from '@regista/db'
import { onboardingMissions, clubs } from '@regista/db'
import { and, eq } from 'drizzle-orm'
import { FinanceService } from '../finances/finance_service.js'

interface MissionDef {
    key: string
    label: string
    reward: number // in cents
}

const MISSIONS: MissionDef[] = [
    { key: 'create_club', label: 'Create your club', reward: 0 }, // Auto-completed
    { key: 'view_squad', label: 'View your squad', reward: 5_000_000 }, // 50K G$
    { key: 'set_tactics', label: 'Set your tactics', reward: 10_000_000 }, // 100K G$
    { key: 'play_match', label: 'Play your first match', reward: 20_000_000 }, // 200K G$
    { key: 'view_standings', label: 'View league standings', reward: 5_000_000 }, // 50K G$
]

export class OnboardingService {
    /**
     * Initialize missions for a new user.
     */
    static async initializeMissions(userId: string) {
        await db.insert(onboardingMissions).values(
            MISSIONS.map((m) => ({
                userId,
                missionKey: m.key,
                rewardAmount: m.reward,
                completedAt: m.key === 'create_club' ? new Date() : null,
                rewardClaimed: m.key === 'create_club',
            })),
        )
    }

    /**
     * Get all missions with their status for a user.
     */
    static async getMissions(userId: string) {
        const missions = await db
            .select()
            .from(onboardingMissions)
            .where(eq(onboardingMissions.userId, userId))

        return MISSIONS.map((def) => {
            const mission = missions.find((m) => m.missionKey === def.key)
            return {
                key: def.key,
                label: def.label,
                reward: def.reward,
                completed: !!mission?.completedAt,
                claimed: !!mission?.rewardClaimed,
            }
        })
    }

    /**
     * Mark a mission as completed (server-side detection).
     */
    static async completeMission(userId: string, missionKey: string) {
        await db
            .update(onboardingMissions)
            .set({ completedAt: new Date() })
            .where(
                and(
                    eq(onboardingMissions.userId, userId),
                    eq(onboardingMissions.missionKey, missionKey),
                ),
            )
    }

    /**
     * Claim reward for a completed mission.
     */
    static async claimReward(userId: string, missionKey: string): Promise<boolean> {
        const [mission] = await db
            .select()
            .from(onboardingMissions)
            .where(
                and(
                    eq(onboardingMissions.userId, userId),
                    eq(onboardingMissions.missionKey, missionKey),
                ),
            )
            .limit(1)

        if (!mission || !mission.completedAt || mission.rewardClaimed || mission.rewardAmount <= 0) {
            return false
        }

        // Get user's club
        const [club] = await db.select({ id: clubs.id }).from(clubs).where(eq(clubs.userId, userId)).limit(1)
        if (!club) return false

        // Credit reward
        await FinanceService.createTransaction(club.id, {
            type: 'other',
            amount: mission.rewardAmount,
            description: `Onboarding reward: ${missionKey.replace(/_/g, ' ')}`,
        })

        // Mark claimed
        await db
            .update(onboardingMissions)
            .set({ rewardClaimed: true })
            .where(eq(onboardingMissions.id, mission.id))

        return true
    }
}
