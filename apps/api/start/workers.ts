import app from '@adonisjs/core/services/app'
import { createEmailWorker } from '../app/workers/email_worker.js'
import { createMatchWorker } from '../app/workers/match_worker.js'
import { createTransferWorker } from '../app/workers/transfer_worker.js'
import { createFinanceWorker } from '../app/workers/finance_worker.js'

const workers: { close: () => Promise<void> }[] = []

app.ready(async () => {
  const emailWorker = createEmailWorker()
  workers.push(emailWorker)

  const matchWorker = createMatchWorker()
  workers.push(matchWorker)

  const transferWorker = createTransferWorker()
  workers.push(transferWorker)

  const financeWorker = createFinanceWorker()
  workers.push(financeWorker)

  console.log('🔧 Workers started: email, match, transfer, finance')
})

app.terminating(async () => {
  await Promise.all(workers.map((w) => w.close()))
})
