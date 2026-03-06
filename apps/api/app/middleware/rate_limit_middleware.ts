import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { redis } from '#services/redis'

interface RateLimitOptions {
  maxAttempts: number
  windowSeconds: number
  keyPrefix: string
}

export function rateLimit(options: RateLimitOptions) {
  return async function rateLimitMiddleware(ctx: HttpContext, next: NextFn) {
    const forwardedFor = ctx.request.header('x-forwarded-for')
    const realIp = ctx.request.header('x-real-ip')
    const proxyIp = forwardedFor?.split(',')[0]?.trim()
    const socketIp = ctx.request.request.socket?.remoteAddress
    const identifier = proxyIp || realIp || socketIp || 'unknown'
    const key = `ratelimit:${options.keyPrefix}:${identifier}`

    const current = await redis.incr(key)

    if (current === 1) {
      await redis.expire(key, options.windowSeconds)
    }

    if (current > options.maxAttempts) {
      const ttl = await redis.ttl(key)
      ctx.response.header('Retry-After', String(ttl > 0 ? ttl : options.windowSeconds))
      return ctx.response.tooManyRequests({
        error: 'TOO_MANY_REQUESTS',
        message: 'Too many requests, please try again later',
      })
    }

    return next()
  }
}
