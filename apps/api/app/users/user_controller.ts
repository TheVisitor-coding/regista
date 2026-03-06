import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { users, refreshTokens } from '@regista/db'
import { eq, and, ne } from 'drizzle-orm'
import { RESERVED_USERNAMES, type AuthUser } from '@regista/shared'
import {
  verifyPassword,
  hashPassword,
  isUsernameTaken,
  isEmailTaken,
  deleteAllRefreshTokens,
  hashToken,
} from '../auth/auth_service.js'
import {
  updateUsernameValidator,
  updateEmailValidator,
  updatePasswordValidator,
  deleteAccountValidator,
} from './user_validator.js'

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

export default class UserController {
  async me({ auth, response }: HttpContext) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1)

    if (!user) {
      return response.notFound({ error: 'User not found' })
    }

    return response.ok({ user: formatUser(user) })
  }

  async updateUsername({ auth, request, response }: HttpContext) {
    const data = await updateUsernameValidator.validate(request.all())

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1)

    if (!user) {
      return response.notFound({ error: 'User not found' })
    }

    if (user.usernameChangesRemaining <= 0) {
      return response.forbidden({
        error: 'No username changes remaining',
      })
    }

    const passwordValid = await verifyPassword(data.password, user.passwordHash)
    if (!passwordValid) {
      return response.unauthorized({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid password',
      })
    }

    if ((RESERVED_USERNAMES as readonly string[]).includes(data.username.toLowerCase())) {
      return response.conflict({
        error: 'USERNAME_TAKEN',
        errors: [{ field: 'username', message: 'This username is reserved', rule: 'reserved' }],
      })
    }

    if (await isUsernameTaken(data.username)) {
      return response.conflict({
        error: 'USERNAME_TAKEN',
        errors: [{ field: 'username', message: 'Username is already taken', rule: 'unique' }],
      })
    }

    const [updated] = await db
      .update(users)
      .set({
        username: data.username,
        usernameChangesRemaining: user.usernameChangesRemaining - 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, auth.userId))
      .returning()

    return response.ok({ user: formatUser(updated) })
  }

  async updateEmail({ auth, request, response }: HttpContext) {
    const data = await updateEmailValidator.validate(request.all())

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1)

    if (!user) {
      return response.notFound({ error: 'User not found' })
    }

    const passwordValid = await verifyPassword(data.password, user.passwordHash)
    if (!passwordValid) {
      return response.unauthorized({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid password',
      })
    }

    if (await isEmailTaken(data.email)) {
      return response.conflict({
        error: 'EMAIL_TAKEN',
        errors: [{ field: 'email', message: 'Email is already taken', rule: 'unique' }],
      })
    }

    const [updated] = await db
      .update(users)
      .set({
        email: data.email.toLowerCase(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, auth.userId))
      .returning()

    return response.ok({ user: formatUser(updated) })
  }

  async updatePassword({ auth, request, response }: HttpContext) {
    const data = await updatePasswordValidator.validate(request.all())

    if (data.newPassword !== data.newPasswordConfirmation) {
      return response.unprocessableEntity({
        errors: [{ field: 'newPasswordConfirmation', message: 'Passwords do not match', rule: 'confirmed' }],
      })
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1)

    if (!user) {
      return response.notFound({ error: 'User not found' })
    }

    const passwordValid = await verifyPassword(data.currentPassword, user.passwordHash)
    if (!passwordValid) {
      return response.unauthorized({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid current password',
      })
    }

    const passwordHash = await hashPassword(data.newPassword)

    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, auth.userId))

    // Invalidate all other sessions (keep current)
    const currentToken = request.cookie('refresh_token')
    if (currentToken) {
      const currentHash = hashToken(currentToken)
      await db
        .delete(refreshTokens)
        .where(
          and(
            eq(refreshTokens.userId, auth.userId),
            ne(refreshTokens.tokenHash, currentHash),
          ),
        )
    } else {
      await deleteAllRefreshTokens(auth.userId)
    }

    return response.ok({ message: 'Password updated successfully' })
  }

  async deleteAccount({ auth, request, response }: HttpContext) {
    const data = await deleteAccountValidator.validate(request.all())

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, auth.userId))
      .limit(1)

    if (!user) {
      return response.notFound({ error: 'User not found' })
    }

    const passwordValid = await verifyPassword(data.password, user.passwordHash)
    if (!passwordValid) {
      return response.unauthorized({
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid password',
      })
    }

    await db
      .update(users)
      .set({ status: 'deleted', updatedAt: new Date() })
      .where(eq(users.id, auth.userId))

    await deleteAllRefreshTokens(auth.userId)

    response.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth',
    })

    return response.ok({ message: 'Account deleted' })
  }

  async getSessions({ auth, request, response }: HttpContext) {
    const sessions = await db
      .select({
        id: refreshTokens.id,
        tokenHash: refreshTokens.tokenHash,
        createdAt: refreshTokens.createdAt,
        expiresAt: refreshTokens.expiresAt,
      })
      .from(refreshTokens)
      .where(eq(refreshTokens.userId, auth.userId))

    const currentToken = request.cookie('refresh_token')
    const currentHash = currentToken ? hashToken(currentToken) : null

    return response.ok({
      sessions: sessions.map((s) => ({
        id: s.id,
        isCurrent: s.tokenHash === currentHash,
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
      })),
    })
  }

  async revokeSessions({ auth, request, response }: HttpContext) {
    const currentToken = request.cookie('refresh_token')

    if (currentToken) {
      const currentHash = hashToken(currentToken)
      await db
        .delete(refreshTokens)
        .where(
          and(
            eq(refreshTokens.userId, auth.userId),
            ne(refreshTokens.tokenHash, currentHash),
          ),
        )
    } else {
      await deleteAllRefreshTokens(auth.userId)
    }

    return response.ok({ message: 'All other sessions revoked' })
  }
}
