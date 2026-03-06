import type { HttpContext } from '@adonisjs/core/http'
import { sqlClient } from '@regista/db'
import { redis } from '#services/redis'

export default class HealthController {
  async check({ response }: HttpContext) {
    const checks = {
      database: false,
      redis: false,
    }

    try {
      await sqlClient`select 1 as ok`
      checks.database = true
    } catch {
      checks.database = false
    }

    try {
      const redisResponse = await redis.ping()
      checks.redis = redisResponse === 'PONG'
    } catch {
      checks.redis = false
    }

    const healthy = checks.database && checks.redis

    return response.status(healthy ? 200 : 503).send({
      status: healthy ? 'ok' : 'degraded',
      checks,
    })
  }
}
