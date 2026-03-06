import { Redis } from 'ioredis'
import env from '#start/env'

const redisUrl = env.get('REDIS_URL')

export const redis = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
})

export const bullmqRedis = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
})
