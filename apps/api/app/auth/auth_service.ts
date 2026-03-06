import { randomUUID, createHash } from 'node:crypto'
import bcrypt from 'bcrypt'
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { db } from '@regista/db'
import {
  users,
  refreshTokens,
  emailVerificationTokens,
  passwordResetTokens,
} from '@regista/db'
import { eq, sql } from 'drizzle-orm'
import env from '#start/env'
import {
  BCRYPT_SALT_ROUNDS,
  ACCESS_TOKEN_EXPIRY_MINUTES,
  REFRESH_TOKEN_EXPIRY_DAYS,
  EMAIL_VERIFICATION_EXPIRY_HOURS,
  PASSWORD_RESET_EXPIRY_HOURS,
  type UserPayload,
} from '@regista/shared'

const jwtSecret = new TextEncoder().encode(env.get('JWT_SECRET'))

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function generateAccessToken(payload: UserPayload): Promise<string> {
  return new SignJWT({ username: payload.username } as unknown as JWTPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TOKEN_EXPIRY_MINUTES}m`)
    .sign(jwtSecret)
}

export async function verifyAccessToken(
  token: string,
): Promise<UserPayload | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret)
    return {
      sub: payload.sub!,
      username: payload.username as string,
    }
  } catch {
    return null
  }
}

export async function generateRefreshToken(userId: string): Promise<string> {
  const raw = randomUUID()
  const hashed = hashToken(raw)
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashed,
    expiresAt,
  })

  return raw
}

export async function rotateRefreshToken(
  oldTokenRaw: string,
  userId: string,
): Promise<{ newToken: string; user: typeof users.$inferSelect } | null> {
  const hashed = hashToken(oldTokenRaw)

  const [existing] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, hashed))
    .limit(1)

  if (!existing || existing.expiresAt < new Date() || existing.userId !== userId) {
    return null
  }

  await db.delete(refreshTokens).where(eq(refreshTokens.id, existing.id))

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user || user.status === 'deleted' || user.status === 'banned') {
    return null
  }

  await db
    .update(users)
    .set({ lastActiveAt: new Date() })
    .where(eq(users.id, userId))

  const newToken = await generateRefreshToken(userId)

  return { newToken, user }
}

export async function findRefreshTokenUserId(tokenRaw: string): Promise<string | null> {
  const hashed = hashToken(tokenRaw)
  const [existing] = await db
    .select({ userId: refreshTokens.userId })
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, hashed))
    .limit(1)

  if (!existing) return null
  return existing.userId
}

export async function deleteRefreshToken(tokenRaw: string): Promise<void> {
  const hashed = hashToken(tokenRaw)
  await db.delete(refreshTokens).where(eq(refreshTokens.tokenHash, hashed))
}

export async function deleteAllRefreshTokens(userId: string): Promise<void> {
  await db.delete(refreshTokens).where(eq(refreshTokens.userId, userId))
}

export async function generateEmailVerificationToken(userId: string): Promise<string> {
  const raw = randomUUID()
  const hashed = hashToken(raw)
  const expiresAt = new Date(
    Date.now() + EMAIL_VERIFICATION_EXPIRY_HOURS * 60 * 60 * 1000,
  )

  await db.insert(emailVerificationTokens).values({
    userId,
    tokenHash: hashed,
    expiresAt,
  })

  return raw
}

export async function generatePasswordResetToken(userId: string): Promise<string> {
  const raw = randomUUID()
  const hashed = hashToken(raw)
  const expiresAt = new Date(
    Date.now() + PASSWORD_RESET_EXPIRY_HOURS * 60 * 60 * 1000,
  )

  await db.insert(passwordResetTokens).values({
    userId,
    tokenHash: hashed,
    expiresAt,
  })

  return raw
}

export async function findUserByLogin(
  login: string,
): Promise<typeof users.$inferSelect | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(
      login.includes('@')
        ? sql`lower(${users.email}) = lower(${login})`
        : sql`lower(${users.username}) = lower(${login})`,
    )
    .limit(1)

  return user ?? null
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.username}) = lower(${username})`)
    .limit(1)

  return !!existing
}

export async function isEmailTaken(email: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = lower(${email})`)
    .limit(1)

  return !!existing
}
