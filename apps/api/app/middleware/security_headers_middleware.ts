import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'

export default class SecurityHeadersMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    ctx.response.header('X-Content-Type-Options', 'nosniff')
    ctx.response.header('X-Frame-Options', 'DENY')
    ctx.response.header('Referrer-Policy', 'strict-origin-when-cross-origin')

    if (process.env.NODE_ENV === 'production') {
      ctx.response.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }

    return next()
  }
}
