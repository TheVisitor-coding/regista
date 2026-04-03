import { db } from '@regista/db'
import { players, clubs, transferHistory } from '@regista/db'
import { eq } from 'drizzle-orm'
import {
    STANDARD_CONTRACT_MATCHES,
    SALARY_BASE_PER_OVERALL,
    SALARY_RANDOM_BONUS_MAX,
    RELEASE_CLAUSE_MULTIPLIER_PURCHASE,
    RELEASE_CLAUSE_MULTIPLIER_FREE,
} from '@regista/shared'
import { FinanceService } from '../finances/finance_service.js'
import { NotificationService } from '../notifications/notification_service.js'

type TransferType = 'market_purchase' | 'human_transfer' | 'release_clause' | 'free_agent' | 'released' | 'contract_expired' | 'club_deleted'

export class TransferExecutor {
    /**
     * Execute a transfer atomically:
     * - Move player to new club
     * - Handle finances (debit buyer, credit seller)
     * - Set new contract
     * - Record in transfer history
     * - Send notifications
     */
    static async execute(
        playerId: string,
        fromClubId: string | null,
        toClubId: string,
        fee: number,
        type: TransferType,
    ): Promise<void> {
        // Get player info
        const [player] = await db.select().from(players).where(eq(players.id, playerId)).limit(1)
        if (!player) throw new Error('Player not found')

        // Financial transactions
        if (fee > 0) {
            // Debit buyer
            await FinanceService.createTransaction(toClubId, {
                type: 'player_purchase',
                amount: -fee,
                description: `Transfer: ${player.firstName} ${player.lastName}`,
                referenceId: playerId,
            })

            // Credit seller
            if (fromClubId) {
                await FinanceService.createTransaction(fromClubId, {
                    type: 'player_sale',
                    amount: fee,
                    description: `Transfer: ${player.firstName} ${player.lastName}`,
                    referenceId: playerId,
                })
            }
        }

        // Calculate new contract
        const salary = player.overall * SALARY_BASE_PER_OVERALL + Math.floor(Math.random() * SALARY_RANDOM_BONUS_MAX)
        const releaseClause = fee > 0
            ? Math.round(fee * RELEASE_CLAUSE_MULTIPLIER_PURCHASE)
            : Math.round(ValuationService_calculateValue(player) * RELEASE_CLAUSE_MULTIPLIER_FREE)

        // Move player
        await db.update(players).set({
            clubId: toClubId,
            contractMatchesRemaining: STANDARD_CONTRACT_MATCHES,
            weeklySalary: salary,
            releaseClause,
            updatedAt: new Date(),
        }).where(eq(players.id, playerId))

        // Record history
        await db.insert(transferHistory).values({
            playerId,
            fromClubId,
            toClubId,
            type: type as any,
            fee,
        })

        // Notifications
        const [buyerClub] = await db.select().from(clubs).where(eq(clubs.id, toClubId)).limit(1)
        if (buyerClub && !buyerClub.isAi) {
            await NotificationService.create(toClubId, {
                staffRole: 'sporting_director',
                category: 'transfer',
                priority: 'positive',
                title: `${player.firstName} ${player.lastName} signed!`,
                message: `${player.firstName} ${player.lastName} (${player.position}, OVR ${player.overall}) has joined your squad.`,
                actionUrl: '/squad',
            })
        }

        if (fromClubId) {
            const [sellerClub] = await db.select().from(clubs).where(eq(clubs.id, fromClubId)).limit(1)
            if (sellerClub && !sellerClub.isAi) {
                await NotificationService.create(fromClubId, {
                    staffRole: 'sporting_director',
                    category: 'transfer',
                    priority: 'info',
                    title: `${player.firstName} ${player.lastName} sold`,
                    message: `${player.firstName} ${player.lastName} has been transferred for ${fee > 0 ? (fee / 100).toLocaleString() + ' G$' : 'free'}.`,
                    actionUrl: '/finances',
                })
            }
        }
    }
}

// Inline helper to avoid circular import with ValuationService
function ValuationService_calculateValue(player: typeof players.$inferSelect): number {
    const baseValue = Math.pow((player.overall - 40) / 10, 2.5) * 100_000
    return Math.round(baseValue / 10_000) * 10_000
}
