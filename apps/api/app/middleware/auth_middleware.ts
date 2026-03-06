import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { verifyAccessToken } from '../auth/auth_service.js'

declare module '@adonisjs/core/http' {
  interface HttpContext {
    auth: {
      userId: string
      username: string
    }
  }
}

export async function authMiddleware(ctx: HttpContext, next: NextFn) {
  const authHeader = ctx.request.header('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return ctx.response.unauthorized({
      error: 'TOKEN_INVALID',
      message: 'Authentication required',
    })
  }

  const token = authHeader.slice(7)
  const payload = await verifyAccessToken(token)

  if (!payload) {
    return ctx.response.unauthorized({
      error: 'TOKEN_EXPIRED',
      message: 'Token expired or invalid',
    })
  }

  ctx.auth = {
    userId: payload.sub,
    username: payload.username,
  }

  return next()
}
