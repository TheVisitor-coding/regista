import { db } from '@regista/db'
import { freeAgents, players, clubs, transferHistory } from '@regista/db'
import { and, count, eq } from 'drizzle-orm'
import {
    MIN_SQUAD_SIZE,
    SQUAD_MAX_PLAYERS,
    STANDARD_CONTRACT_MATCHES,
    SALARY_BASE_PER_OVERALL,
    SALARY_RANDOM_BONUS_MAX,
    FREE_AGENT_MAX_DAYS,
    RELEASE_CLAUSE_MULTIPLIER_FREE,
} from '@regista/shared'
import { NotificationService } from '../notifications/notification_service.js'

export class FreeAgentService {
    static async signFreeAgent(clubId: string, freeAgentId: string): Promise<void> {
        const [fa] = await db.select().from(freeAgents).where(eq(freeAgents.id, freeAgentId)).limit(1)
        if (!fa) throw new Error('Free agent not found')

        // Check squad size
        const [squadCount] = await db.select({ value: count(players.id) }).from(players).where(eq(players.clubId, clubId))
        if ((squadCount?.value ?? 0) >= SQUAD_MAX_PLAYERS) throw new Error('Squad is full')

        const [player] = await db.select().from(players).where(eq(players.id, fa.playerId)).limit(1)
        if (!player) throw new Error('Player not found')

        const salary = player.overall * SALARY_BASE_PER_OVERALL + Math.floor(Math.random() * SALARY_RANDOM_BONUS_MAX)
        const baseValue = Math.pow((player.overall - 40) / 10, 2.5) * 100_000
        const releaseClause = Math.round(baseValue * RELEASE_CLAUSE_MULTIPLIER_FREE / 10_000) * 10_000

        // Move player to club
        await db.update(players).set({
            clubId,
            contractMatchesRemaining: STANDARD_CONTRACT_MATCHES,
            weeklySalary: salary,
            releaseClause,
            updatedAt: new Date(),
        }).where(eq(players.id, fa.playerId))

        // Record history
        await db.insert(transferHistory).values({
            playerId: fa.playerId,
            fromClubId: null,
            toClubId: clubId,
            type: 'free_agent',
            fee: 0,
        })

        // Remove from free agents
        await db.delete(freeAgents).where(eq(freeAgents.id, freeAgentId))

        // Notify
        const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId)).limit(1)
        if (club && !club.isAi) {
            await NotificationService.create(clubId, {
                staffRole: 'sporting_director',
                category: 'transfer',
                priority: 'positive',
                title: `${player.firstName} ${player.lastName} signed as free agent!`,
                message: `${player.firstName} ${player.lastName} (${player.position}, OVR ${player.overall}) has joined on a free transfer.`,
                actionUrl: '/squad',
            })
        }
    }

    static async releasePlayer(clubId: string, playerId: string): Promise<void> {
        const [player] = await db.select().from(players).where(and(eq(players.id, playerId), eq(players.clubId, clubId))).limit(1)
        if (!player) throw new Error('Player not found in your club')

        // Check squad size
        const [squadCount] = await db.select({ value: count(players.id) }).from(players).where(eq(players.clubId, clubId))
        if ((squadCount?.value ?? 0) <= MIN_SQUAD_SIZE) throw new Error('Cannot release: squad would drop below minimum')

        // Calculate indemnity
        let indemnity = 0
        if (player.contractMatchesRemaining > 3) {
            indemnity = Math.ceil(player.weeklySalary * (player.contractMatchesRemaining / 3))
        }

        // Check balance for indemnity
        if (indemnity > 0) {
            const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId)).limit(1)
            if (!club || club.balance < indemnity) throw new Error('Insufficient funds for release indemnity')

            const { FinanceService } = await import('../finances/finance_service.js')
            await FinanceService.createTransaction(clubId, {
                type: 'other',
                amount: -indemnity,
                description: `Release indemnity: ${player.firstName} ${player.lastName}`,
                referenceId: playerId,
            })
        }

        // Add to free agent pool
        const expiresAt = new Date(Date.now() + FREE_AGENT_MAX_DAYS * 24 * 60 * 60 * 1000)
        await db.insert(freeAgents).values({
            playerId,
            previousClubId: clubId,
            reason: 'released',
            expiresAt,
        })

        // Remove from club
        await db.update(players).set({
            clubId: null,
            contractMatchesRemaining: 0,
            updatedAt: new Date(),
        }).where(eq(players.id, playerId))

        // Record history
        await db.insert(transferHistory).values({
            playerId,
            fromClubId: clubId,
            toClubId: null,
            type: 'released',
            fee: 0,
        })
    }

    static async addToFreeAgentPool(playerId: string, reason: 'released' | 'contract_expired' | 'club_deleted', previousClubId: string | null): Promise<void> {
        const expiresAt = new Date(Date.now() + FREE_AGENT_MAX_DAYS * 24 * 60 * 60 * 1000)
        await db.insert(freeAgents).values({
            playerId,
            previousClubId,
            reason: reason as any,
            expiresAt,
        })
    }
}
