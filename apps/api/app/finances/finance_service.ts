import { db } from '@regista/db'
import { clubs, financialTransactions, players } from '@regista/db'
import { eq, sql, sum } from 'drizzle-orm'
import { FINANCE_ALERT_THRESHOLD, FINANCE_CRITICAL_THRESHOLD } from '@regista/shared'
import { NotificationService } from '../notifications/notification_service.js'

type TransactionType = 'ticket_revenue' | 'tv_rights' | 'player_sale' | 'salary' | 'player_purchase' | 'prize' | 'other'

interface CreateTransactionData {
    type: TransactionType
    amount: number
    description: string
    referenceId?: string
}

// Revenue constants by division level
const TICKET_BASE: Record<number, number> = { 1: 15_000_000, 2: 10_000_000, 3: 7_000_000 }
const AWAY_REVENUE: Record<number, number> = { 1: 5_000_000, 2: 3_000_000, 3: 2_000_000 }
const TV_RIGHTS_PER_SEASON: Record<number, number> = { 1: 100_000_000, 2: 60_000_000, 3: 30_000_000 }
const MATCH_PRIME_WIN = 5_000_000
const MATCH_PRIME_DRAW = 2_000_000
const FORCED_SALE_THRESHOLD = -200_000_000 // -2M G$

function randomVariation(base: number, pct: number = 0.10): number {
    return Math.round(base * (1 + (Math.random() * 2 - 1) * pct))
}

export class FinanceService {
    static async createTransaction(clubId: string, data: CreateTransactionData) {
        return db.transaction(async (tx) => {
            const [updatedClub] = await tx
                .update(clubs)
                .set({
                    balance: sql`${clubs.balance} + ${data.amount}`,
                    updatedAt: new Date(),
                })
                .where(eq(clubs.id, clubId))
                .returning({ balance: clubs.balance })

            if (!updatedClub) {
                throw new Error('Club not found')
            }

            const [transaction] = await tx
                .insert(financialTransactions)
                .values({
                    clubId,
                    type: data.type,
                    amount: data.amount,
                    description: data.description,
                    referenceId: data.referenceId ?? null,
                    balanceAfter: updatedClub.balance,
                })
                .returning()

            return transaction
        })
    }

    /**
     * Calculate and distribute ticket revenue for a home match.
     */
    static calculateTicketRevenue(divisionLevel: number, standingPosition: number): number {
        const base = TICKET_BASE[divisionLevel] ?? 7_000_000
        const rankBonus = standingPosition <= 5 ? 5_000_000 : 0
        return randomVariation(base + rankBonus)
    }

    /**
     * Away match revenue (fixed per division).
     */
    static calculateAwayRevenue(divisionLevel: number): number {
        return AWAY_REVENUE[divisionLevel] ?? 2_000_000
    }

    /**
     * Match prime based on result.
     */
    static calculateMatchPrime(result: 'win' | 'draw' | 'loss'): number {
        if (result === 'win') return MATCH_PRIME_WIN
        if (result === 'draw') return MATCH_PRIME_DRAW
        return 0
    }

    /**
     * Process all match-related revenue for a club.
     */
    static async processMatchRevenue(
        clubId: string,
        matchId: string,
        isHome: boolean,
        result: 'win' | 'draw' | 'loss',
        divisionLevel: number,
        standingPosition: number,
    ) {
        if (isHome) {
            const ticketRev = FinanceService.calculateTicketRevenue(divisionLevel, standingPosition)
            await FinanceService.createTransaction(clubId, {
                type: 'ticket_revenue',
                amount: ticketRev,
                description: `Ticket revenue - Matchday`,
                referenceId: matchId,
            })
        } else {
            const awayRev = FinanceService.calculateAwayRevenue(divisionLevel)
            await FinanceService.createTransaction(clubId, {
                type: 'other',
                amount: awayRev,
                description: `Away match revenue`,
                referenceId: matchId,
            })
        }

        const prime = FinanceService.calculateMatchPrime(result)
        if (prime > 0) {
            await FinanceService.createTransaction(clubId, {
                type: 'prize',
                amount: prime,
                description: `Match prime (${result})`,
                referenceId: matchId,
            })
        }
    }

    /**
     * Distribute TV rights at season start.
     */
    static async distributeTVRights(clubId: string, divisionLevel: number) {
        const amount = TV_RIGHTS_PER_SEASON[divisionLevel] ?? 30_000_000
        await FinanceService.createTransaction(clubId, {
            type: 'tv_rights',
            amount,
            description: `TV rights - Season`,
        })
    }

    /**
     * Process weekly salary for all players of a club.
     */
    static async processWeeklySalary(clubId: string): Promise<number> {
        const [result] = await db
            .select({ total: sum(players.weeklySalary) })
            .from(players)
            .where(eq(players.clubId, clubId))

        const totalSalary = Number(result?.total ?? 0)
        if (totalSalary <= 0) return 0

        await FinanceService.createTransaction(clubId, {
            type: 'salary',
            amount: -totalSalary,
            description: `Weekly salaries`,
        })

        return totalSalary
    }

    /**
     * Check financial health and send alerts.
     */
    static async checkFinancialHealth(clubId: string) {
        const [club] = await db.select().from(clubs).where(eq(clubs.id, clubId)).limit(1)
        if (!club || club.isAi) return

        if (club.balance <= FORCED_SALE_THRESHOLD) {
            // Critical: trigger forced sale notification
            await NotificationService.create(clubId, {
                staffRole: 'sporting_director',
                category: 'finance',
                priority: 'critical',
                title: 'Financial crisis!',
                message: `Your balance is critically low (${(club.balance / 100).toLocaleString()} G$). Consider selling players urgently.`,
                actionUrl: '/finances',
                isPinned: true,
            })
        } else if (club.balance <= FINANCE_CRITICAL_THRESHOLD) {
            await NotificationService.create(clubId, {
                staffRole: 'sporting_director',
                category: 'finance',
                priority: 'critical',
                title: 'Negative balance!',
                message: `Your balance is negative (${(club.balance / 100).toLocaleString()} G$). Transfers are blocked until you return to a positive balance.`,
                actionUrl: '/finances',
                isPinned: true,
            })
        } else if (club.balance <= FINANCE_ALERT_THRESHOLD) {
            await NotificationService.create(clubId, {
                staffRole: 'sporting_director',
                category: 'finance',
                priority: 'warning',
                title: 'Budget running low',
                message: `Your balance is getting low (${(club.balance / 100).toLocaleString()} G$). Be careful with spending.`,
                actionUrl: '/finances',
            })
        }
    }
}
