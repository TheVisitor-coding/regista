import { db } from '@regista/db'
import { users } from '@regista/db'
import { and, eq, lt } from 'drizzle-orm'
import { queueService } from '#services/queue'
import { Worker } from 'bullmq'
import { bullmqRedis } from '#services/redis'

async function checkInactivity() {
  const now = new Date()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const inactive = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(and(eq(users.status, 'active'), lt(users.lastActiveAt, sevenDaysAgo)))

  if (inactive.length > 0) {
    console.log(`⏰ Inactivity check: ${inactive.length} users inactive >7d`)
  }
}

export function createInactivityWorker() {
  const worker = new Worker('email', async (job) => {
    if (job.name === 'check-inactivity') {
      await checkInactivity()
    }
  }, {
    connection: bullmqRedis,
  })

  queueService.enqueue('email', 'check-inactivity', {}, {
    repeat: {
      pattern: '0 6 * * *',
    },
  })

  return worker
}
