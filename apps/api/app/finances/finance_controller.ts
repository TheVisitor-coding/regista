import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { clubs, financialTransactions, players } from '@regista/db'
import { and, count, desc, eq, gte, lt, sum } from 'drizzle-orm'
import { listTransactionsValidator } from './finance_validator.js'

async function getClub(userId: string) {
    const [club] = await db
        .select()
        .from(clubs)
        .where(eq(clubs.userId, userId))
        .limit(1)
    return club ?? null
}

export default class FinanceController {
    async summary({ auth, response }: HttpContext) {
        const club = await getClub(auth.userId)
        if (!club) {
            return response.notFound({ error: 'CLUB_NOT_FOUND' })
        }

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

        // Get transactions from last 7 days grouped by type
        const recentTransactions = await db
            .select({
                type: financialTransactions.type,
                total: sum(financialTransactions.amount),
            })
            .from(financialTransactions)
            .where(
                and(
                    eq(financialTransactions.clubId, club.id),
                    gte(financialTransactions.createdAt, sevenDaysAgo),
                ),
            )
            .groupBy(financialTransactions.type)

        let revenueLastWeek = 0
        let expensesLastWeek = 0
        const breakdownByType = recentTransactions.map((t) => {
            const total = Number(t.total ?? 0)
            if (total > 0) revenueLastWeek += total
            else expensesLastWeek += Math.abs(total)
            return { type: t.type, total }
        })

        // Weekly total salary
        const [salaryResult] = await db
            .select({ total: sum(players.weeklySalary) })
            .from(players)
            .where(eq(players.clubId, club.id))

        return response.ok({
            balance: club.balance,
            revenueLastWeek,
            expensesLastWeek,
            weeklyTotalSalary: Number(salaryResult?.total ?? 0),
            breakdownByType,
        })
    }

    async transactions({ auth, request, response }: HttpContext) {
        const club = await getClub(auth.userId)
        if (!club) {
            return response.notFound({ error: 'CLUB_NOT_FOUND' })
        }

        const params = await listTransactionsValidator.validate(request.qs())
        const limit = params.limit ?? 20

        const conditions = [eq(financialTransactions.clubId, club.id)]

        if (params.type) {
            conditions.push(eq(financialTransactions.type, params.type as any))
        }

        if (params.cursor) {
            const [cursorTx] = await db
                .select({ createdAt: financialTransactions.createdAt })
                .from(financialTransactions)
                .where(eq(financialTransactions.id, params.cursor))
                .limit(1)
            if (cursorTx) {
                conditions.push(lt(financialTransactions.createdAt, cursorTx.createdAt))
            }
        }

        const items = await db
            .select()
            .from(financialTransactions)
            .where(and(...conditions))
            .orderBy(desc(financialTransactions.createdAt))
            .limit(limit + 1)

        const hasMore = items.length > limit
        const results = hasMore ? items.slice(0, limit) : items

        const [totalResult] = await db
            .select({ value: count(financialTransactions.id) })
            .from(financialTransactions)
            .where(eq(financialTransactions.clubId, club.id))

        return response.ok({
            transactions: results.map((t) => ({
                id: t.id,
                clubId: t.clubId,
                type: t.type,
                amount: t.amount,
                description: t.description,
                referenceId: t.referenceId,
                balanceAfter: t.balanceAfter,
                createdAt: t.createdAt.toISOString(),
            })),
            nextCursor: hasMore ? results[results.length - 1].id : null,
            total: totalResult?.value ?? 0,
        })
    }

    async salaryBreakdown({ auth, response }: HttpContext) {
        const club = await getClub(auth.userId)
        if (!club) {
            return response.notFound({ error: 'CLUB_NOT_FOUND' })
        }

        const clubPlayers = await db
            .select({
                id: players.id,
                firstName: players.firstName,
                lastName: players.lastName,
                position: players.position,
                overall: players.overall,
                weeklySalary: players.weeklySalary,
                contractMatchesRemaining: players.contractMatchesRemaining,
            })
            .from(players)
            .where(eq(players.clubId, club.id))

        const totalWeekly = clubPlayers.reduce((sum, p) => sum + p.weeklySalary, 0)

        return response.ok({
            players: clubPlayers.map((p) => ({
                id: p.id,
                name: `${p.firstName} ${p.lastName}`,
                position: p.position,
                overall: p.overall,
                weeklySalary: p.weeklySalary,
                contractMatchesRemaining: p.contractMatchesRemaining,
            })),
            totalWeekly,
            totalMonthly: totalWeekly * 4,
        })
    }
}
