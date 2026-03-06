import { Worker } from 'bullmq'
import { bullmqRedis } from '#services/redis'
import { db } from '@regista/db'
import { refreshTokens, emailVerificationTokens, passwordResetTokens } from '@regista/db'
import { lt } from 'drizzle-orm'
import { queueService } from '#services/queue'

async function cleanup() {
  const now = new Date()

  const [r1] = await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, now)).returning({ id: refreshTokens.id })
  const [r2] = await db.delete(emailVerificationTokens).where(lt(emailVerificationTokens.expiresAt, now)).returning({ id: emailVerificationTokens.id })
  const [r3] = await db.delete(passwordResetTokens).where(lt(passwordResetTokens.expiresAt, now)).returning({ id: passwordResetTokens.id })

  console.log(`🧹 Cleanup: removed expired tokens (refresh: ${r1 ? 'some' : '0'}, email: ${r2 ? 'some' : '0'}, password: ${r3 ? 'some' : '0'})`)
}

export function createCleanupWorker() {
  const worker = new Worker('email', async (job) => {
    if (job.name === 'cleanup-tokens') {
      await cleanup()
    }
  }, {
    connection: bullmqRedis,
  })

  // Schedule daily cleanup at 03:00 UTC
  queueService.enqueue('email', 'cleanup-tokens', {}, {
    repeat: {
      pattern: '0 3 * * *',
    },
  })

  return worker
}
