import { Worker, type Job } from 'bullmq'
import { bullmqRedis } from '#services/redis'
import { db } from '@regista/db'
import { clubs } from '@regista/db'
import { queueService } from '#services/queue'
import { FinanceService } from '../finances/finance_service.js'

async function handleProcessSalaries() {
    console.log('💰 Processing weekly salaries...')

    // Get all human clubs (AI clubs don't need salary tracking for gameplay)
    const allClubs = await db.select({ id: clubs.id, isAi: clubs.isAi }).from(clubs)

    let processed = 0
    for (const club of allClubs) {
        const totalSalary = await FinanceService.processWeeklySalary(club.id)
        if (totalSalary > 0) processed++

        // Check financial health for human clubs after salary
        if (!club.isAi) {
            await FinanceService.checkFinancialHealth(club.id)
        }
    }

    console.log(`💰 Salaries processed for ${processed} clubs`)
}

async function handleJob(job: Job) {
    switch (job.name) {
        case 'process-salaries': return handleProcessSalaries()
        default: console.warn(`Unknown finance job: ${job.name}`)
    }
}

export function createFinanceWorker() {
    const worker = new Worker('finance', handleJob, {
        connection: bullmqRedis,
        concurrency: 1,
    })

    // Weekly salary deduction every Monday at 00:00 UTC
    queueService.enqueue('finance', 'process-salaries', {}, {
        repeat: { pattern: '0 0 * * 1' },
    })

    return worker
}
