import { Worker, type Job } from 'bullmq'
import { bullmqRedis } from '#services/redis'
import { sendEmail } from '#services/email_service'

interface VerificationEmailData {
  to: string
  username: string
  token: string
}

interface PasswordResetEmailData {
  to: string
  username: string
  token: string
}

const FRONTEND_URL = process.env.VITE_API_URL?.replace(':3001', ':3000') || 'http://localhost:3000'

async function handleJob(job: Job) {
  switch (job.name) {
    case 'send-verification': {
      const data = job.data as VerificationEmailData
      const link = `${FRONTEND_URL}/verify-email?token=${data.token}`
      await sendEmail({
        to: data.to,
        subject: 'Regista - Verify your email',
        text: `Hello ${data.username},\n\nPlease verify your email by clicking: ${link}\n\nThis link expires in 24 hours.\n\n- Regista`,
      })
      break
    }
    case 'send-password-reset': {
      const data = job.data as PasswordResetEmailData
      const link = `${FRONTEND_URL}/reset-password?token=${data.token}`
      await sendEmail({
        to: data.to,
        subject: 'Regista - Reset your password',
        text: `Hello ${data.username},\n\nReset your password: ${link}\n\nThis link expires in 1 hour.\n\n- Regista`,
      })
      break
    }
    default:
      console.warn(`Unknown email job: ${job.name}`)
  }
}

export function createEmailWorker() {
  return new Worker('email', handleJob, {
    connection: bullmqRedis,
    concurrency: 5,
  })
}
