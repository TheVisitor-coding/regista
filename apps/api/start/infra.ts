import app from '@adonisjs/core/services/app'
import { bullmqRedis, redis } from '#services/redis'
import { queueService } from '#services/queue'

app.terminating(async () => {
    await queueService.closeAll()
    await Promise.all([redis.quit(), bullmqRedis.quit()])
})
