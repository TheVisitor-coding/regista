import { Worker, type Job } from 'bullmq'
import { bullmqRedis } from '#services/redis'
import { db } from '@regista/db'
import { transferListings, transferOffers, freeAgents, players } from '@regista/db'
import { and, eq, lt, lte } from 'drizzle-orm'
import { queueService } from '#services/queue'
import { MarketService } from '../transfers/market_service.js'
import { FREE_AGENT_PENALTY_DAY, FREE_AGENT_PENALTY_OVERALL } from '@regista/shared'

async function handleRefreshAiMarket() {
    console.log('🔄 Refreshing AI market...')

    // Remove expired AI listings
    const expiredDate = new Date()
    await db.update(transferListings).set({ status: 'expired' })
        .where(and(
            eq(transferListings.source, 'ai_market'),
            eq(transferListings.status, 'active'),
            lte(transferListings.expiresAt, expiredDate),
        ))

    // Generate new players to fill market
    const generated = await MarketService.generateAiMarketPlayers()
    console.log(`🔄 AI market refreshed: ${generated} new players`)
}

async function handleExpireOffers() {
    const now = new Date()

    // Expire pending offers
    await db.update(transferOffers).set({ status: 'expired' })
        .where(and(eq(transferOffers.status, 'pending'), lt(transferOffers.expiresAt, now)))

    // Expire counter-offers
    await db.update(transferOffers).set({ counterStatus: 'expired' })
        .where(and(eq(transferOffers.status, 'counter_offered'), eq(transferOffers.counterStatus, 'pending'), lt(transferOffers.expiresAt, now)))
}

async function handleExpireFreeAgents() {
    const now = new Date()

    // Apply -2 overall penalty at day 7
    const penaltyThreshold = new Date(now.getTime() - FREE_AGENT_PENALTY_DAY * 24 * 60 * 60 * 1000)
    const needPenalty = await db.select().from(freeAgents)
        .where(and(eq(freeAgents.penaltyApplied, false), lte(freeAgents.createdAt, penaltyThreshold)))

    for (const fa of needPenalty) {
        const [player] = await db.select().from(players).where(eq(players.id, fa.playerId)).limit(1)
        if (player) {
            await db.update(players).set({
                overall: Math.max(30, player.overall - FREE_AGENT_PENALTY_OVERALL),
                updatedAt: new Date(),
            }).where(eq(players.id, fa.playerId))
        }
        await db.update(freeAgents).set({ penaltyApplied: true }).where(eq(freeAgents.id, fa.id))
    }

    // Remove expired free agents (14 days)
    await db.delete(freeAgents).where(lte(freeAgents.expiresAt, now))

    console.log('🔄 Free agents cleanup done')
}

async function handleJob(job: Job) {
    switch (job.name) {
        case 'refresh-ai-market': return handleRefreshAiMarket()
        case 'expire-offers': return handleExpireOffers()
        case 'expire-free-agents': return handleExpireFreeAgents()
        default: console.warn(`Unknown transfer job: ${job.name}`)
    }
}

export function createTransferWorker() {
    const worker = new Worker('transfer', handleJob, {
        connection: bullmqRedis,
        concurrency: 2,
    })

    // Schedule jobs
    queueService.enqueue('transfer', 'refresh-ai-market', {}, {
        repeat: { pattern: '0 4 * * *' }, // Daily at 04:00 UTC
    })
    queueService.enqueue('transfer', 'expire-offers', {}, {
        repeat: { pattern: '0 * * * *' }, // Hourly
    })
    queueService.enqueue('transfer', 'expire-free-agents', {}, {
        repeat: { pattern: '0 4 * * *' }, // Daily at 04:00 UTC
    })

    return worker
}
