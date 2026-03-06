import app from '@adonisjs/core/services/app'
import { createEmailWorker } from '../app/workers/email_worker.js'

const workers: { close: () => Promise<void> }[] = []

app.ready(async () => {
  const emailWorker = createEmailWorker()
  workers.push(emailWorker)
  console.log('🔧 Workers started: email')
})

app.terminating(async () => {
  await Promise.all(workers.map((w) => w.close()))
})
