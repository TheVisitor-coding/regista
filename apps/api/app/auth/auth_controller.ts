import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { users, emailVerificationTokens, passwordResetTokens } from '@regista/db'
import { eq } from 'drizzle-orm'
import { REFRESH_TOKEN_EXPIRY_DAYS, RESERVED_USERNAMES, type AuthUser } from '@regista/shared'
import { queueService } from '#services/queue'
import {
  registerValidator,
  loginValidator,
  verifyEmailValidator,
  resendVerificationValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from './auth_validator.js'
import {
  hashPassword,
  verifyPassword,
  generateAccessToken,
  generateRefreshToken,
  generateEmailVerificationToken,
  generatePasswordResetToken,
  findUserByLogin,
  isUsernameTaken,
  isEmailTaken,
  hashToken,
  deleteRefreshToken,
  deleteAllRefreshTokens,
  findRefreshTokenUserId,
  rotateRefreshToken,
} from './auth_service.js'

const REFRESH_COOKIE = 'refresh_token'

function setRefreshCookie(ctx: HttpContext, token: string, remember: boolean) {
  const maxAge = remember
    ? REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60
    : undefined

  ctx.response.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/auth',
    maxAge,
  })
}

function clearRefreshCookie(ctx: HttpContext) {
  ctx.response.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/auth',
  })
}

function formatUser(user: typeof users.$inferSelect): AuthUser {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    status: user.status,
    hasClub: false,
    clubId: null,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    usernameChangesRemaining: user.usernameChangesRemaining,
    createdAt: user.createdAt.toISOString(),
  }
}

export default class AuthController {
  async register({ request, response }: HttpContext) {
    const data = await registerValidator.validate(request.all())

    if (data.password !== data.passwordConfirmation) {
      return response.unprocessableEntity({
        errors: [{ field: 'passwordConfirmation', message: 'Passwords do not match', rule: 'confirmed' }],
      })
    }

    if (await isUsernameTaken(data.username)) {
      return response.conflict({
        error: 'USERNAME_TAKEN',
        errors: [{ field: 'username', message: 'Username is already taken', rule: 'unique' }],
      })
    }

    const lowerUsername = data.username.toLowerCase()
    if ((RESERVED_USERNAMES as readonly string[]).includes(lowerUsername)) {
      return response.conflict({
        error: 'USERNAME_TAKEN',
        errors: [{ field: 'username', message: 'This username is reserved', rule: 'reserved' }],
      })
    }

    if (await isEmailTaken(data.email)) {
      return response.conflict({
        error: 'EMAIL_TAKEN',
        errors: [{ field: 'email', message: 'Email is already taken', rule: 'unique' }],
      })
    }

    const passwordHash = await hashPassword(data.password)

    const [user] = await db
      .insert(users)
      .values({
        username: data.username,
        email: data.email.toLowerCase(),
        passwordHash,
        status: 'pending_verification',
      })
      .returning()

    const verificationToken = await generateEmailVerificationToken(user.id)

    await queueService.enqueue('email', 'send-verification', {
      to: user.email,
      username: user.username,
      token: verificationToken,
    })

    return response.created({
      user: formatUser(user),
      needsVerification: true,
    })
  }

  async login(ctx: HttpContext) {
    const data = await loginValidator.validate(ctx.request.all())

    const user = await findUserByLogin(data.login)

    if (!user) {
      return ctx.response.unauthorized({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials',
      })
    }

    const passwordValid = await verifyPassword(data.password, user.passwordHash)
    if (!passwordValid) {
      return ctx.response.unauthorized({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials',
      })
    }

    if (user.status === 'banned') {
      return ctx.response.forbidden({
        error: 'ACCOUNT_BANNED',
        message: 'Your account has been banned',
      })
    }

    if (user.status === 'deleted') {
      return ctx.response.unauthorized({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid credentials',
      })
    }

    if (user.status === 'pending_verification') {
      return ctx.response.ok({
        user: formatUser(user),
        accessToken: '',
        needsVerification: true,
      })
    }

    const accessToken = await generateAccessToken({
      sub: user.id,
      username: user.username,
    })

    const refreshToken = await generateRefreshToken(user.id)
    setRefreshCookie(ctx, refreshToken, data.rememberMe ?? false)

    await db
      .update(users)
      .set({ lastLoginAt: new Date(), lastActiveAt: new Date() })
      .where(eq(users.id, user.id))

    return ctx.response.ok({
      accessToken,
      user: formatUser(user),
    })
  }

  async logout(ctx: HttpContext) {
    const token = ctx.request.cookie(REFRESH_COOKIE)
    if (token) {
      await deleteRefreshToken(token)
    }
    clearRefreshCookie(ctx)
    return ctx.response.ok({ message: 'Logged out' })
  }

  async refresh(ctx: HttpContext) {
    const token = ctx.request.cookie(REFRESH_COOKIE)

    if (!token) {
      return ctx.response.unauthorized({
        error: 'TOKEN_INVALID',
        message: 'No refresh token',
      })
    }

    const userId = await findRefreshTokenUserId(token)
    if (!userId) {
      clearRefreshCookie(ctx)
      return ctx.response.unauthorized({
        error: 'TOKEN_INVALID',
        message: 'Invalid refresh token',
      })
    }

    const result = await rotateRefreshToken(token, userId)
    if (!result) {
      clearRefreshCookie(ctx)
      return ctx.response.unauthorized({
        error: 'TOKEN_INVALID',
        message: 'Invalid refresh token',
      })
    }

    const accessToken = await generateAccessToken({
      sub: result.user.id,
      username: result.user.username,
    })

    setRefreshCookie(ctx, result.newToken, true)

    return ctx.response.ok({ accessToken })
  }

  async verifyEmail({ request, response }: HttpContext) {
    const { token } = await verifyEmailValidator.validate(request.all())
    const hashed = hashToken(token)

    const [record] = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.tokenHash, hashed))
      .limit(1)

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return response.badRequest({
        error: 'TOKEN_INVALID',
        message: 'Invalid or expired verification token',
      })
    }

    await db
      .update(emailVerificationTokens)
      .set({ usedAt: new Date() })
      .where(eq(emailVerificationTokens.id, record.id))

    await db
      .update(users)
      .set({ status: 'active', emailVerifiedAt: new Date() })
      .where(eq(users.id, record.userId))

    return response.ok({ message: 'Email verified successfully' })
  }

  async resendVerification({ request, response }: HttpContext) {
    const { email } = await resendVerificationValidator.validate(request.all())

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (user && user.status === 'pending_verification') {
      const token = await generateEmailVerificationToken(user.id)
      await queueService.enqueue('email', 'send-verification', {
        to: user.email,
        username: user.username,
        token,
      })
    }

    return response.ok({ message: 'If an account exists, a verification email has been sent' })
  }

  async forgotPassword({ request, response }: HttpContext) {
    const { email } = await forgotPasswordValidator.validate(request.all())

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (user && user.status === 'active') {
      const token = await generatePasswordResetToken(user.id)
      await queueService.enqueue('email', 'send-password-reset', {
        to: user.email,
        username: user.username,
        token,
      })
    }

    return response.ok({ message: 'If an account exists, a password reset email has been sent' })
  }

  async resetPassword({ request, response }: HttpContext) {
    const data = await resetPasswordValidator.validate(request.all())

    if (data.password !== data.passwordConfirmation) {
      return response.unprocessableEntity({
        errors: [{ field: 'passwordConfirmation', message: 'Passwords do not match', rule: 'confirmed' }],
      })
    }

    const hashed = hashToken(data.token)

    const [record] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, hashed))
      .limit(1)

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return response.badRequest({
        error: 'TOKEN_INVALID',
        message: 'Invalid or expired reset token',
      })
    }

    const passwordHash = await hashPassword(data.password)

    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, record.id))

    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, record.userId))

    await deleteAllRefreshTokens(record.userId)

    return response.ok({ message: 'Password reset successfully' })
  }

  async checkUsername({ request, response }: HttpContext) {
    const q = request.qs().q as string
    if (!q || q.length < 3) {
      return response.ok({ available: false, reason: 'Too short' })
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(q)) {
      return response.ok({ available: false, reason: 'Invalid characters' })
    }

    if ((RESERVED_USERNAMES as readonly string[]).includes(q.toLowerCase())) {
      return response.ok({ available: false, reason: 'Reserved' })
    }

    const taken = await isUsernameTaken(q)
    return response.ok({ available: !taken, reason: taken ? 'Taken' : undefined })
  }

  async checkEmail({ request, response }: HttpContext) {
    const q = request.qs().q as string
    if (!q || !q.includes('@')) {
      return response.ok({ available: false })
    }

    const taken = await isEmailTaken(q)
    return response.ok({ available: !taken })
  }
}
