import { test } from '@japa/runner'
import { db } from '@regista/db'
import { users, emailVerificationTokens, refreshTokens } from '@regista/db'
import { hashPassword } from '../../../app/auth/auth_service.js'
import { redis } from '#services/redis'

async function createVerifiedUser() {
  const passwordHash = await hashPassword('Password1')
  const [user] = await db.insert(users).values({
    username: 'testuser',
    email: 'test@example.com',
    passwordHash,
    status: 'active',
    emailVerifiedAt: new Date(),
  }).returning()
  return user
}

test.group('Auth - Refresh & Logout', (group) => {
  group.each.setup(async () => {
    await redis.flushdb()
    await db.delete(refreshTokens)
    await db.delete(emailVerificationTokens)
    await db.delete(users)
  })

  test('refresh returns new access token', async ({ client, assert }) => {
    await createVerifiedUser()

    const loginResponse = await client.post('/auth/login').json({
      login: 'test@example.com',
      password: 'Password1',
    })

    loginResponse.assertStatus(200)

    const cookies = loginResponse.headers()['set-cookie']
    assert.exists(cookies)

    const refreshCookie = (Array.isArray(cookies) ? cookies : [cookies])
      .find((c: string) => c.startsWith('refresh_token='))

    assert.exists(refreshCookie)

    const refreshResponse = await client
      .post('/auth/refresh')
      .header('cookie', refreshCookie!)

    refreshResponse.assertStatus(200)
    assert.exists(refreshResponse.body().accessToken)
  })

  test('refresh without cookie returns 401', async ({ client }) => {
    const response = await client.post('/auth/refresh')
    response.assertStatus(401)
  })

  test('protected route without token returns 401', async ({ client }) => {
    const response = await client.get('/users/me')
    response.assertStatus(401)
  })

  test('protected route with valid token returns 200', async ({ client }) => {
    await createVerifiedUser()

    const loginResponse = await client.post('/auth/login').json({
      login: 'test@example.com',
      password: 'Password1',
    })

    const { accessToken } = loginResponse.body()

    const response = await client
      .get('/users/me')
      .header('authorization', `Bearer ${accessToken}`)

    response.assertStatus(200)
    response.assertBodyContains({ user: { username: 'testuser' } })
  })

  test('logout clears refresh token', async ({ client }) => {
    await createVerifiedUser()

    const loginResponse = await client.post('/auth/login').json({
      login: 'test@example.com',
      password: 'Password1',
    })

    const { accessToken } = loginResponse.body()
    const cookies = loginResponse.headers()['set-cookie']
    const refreshCookie = (Array.isArray(cookies) ? cookies : [cookies])
      .find((c: string) => c.startsWith('refresh_token='))

    const logoutResponse = await client
      .post('/auth/logout')
      .header('authorization', `Bearer ${accessToken}`)
      .header('cookie', refreshCookie!)

    logoutResponse.assertStatus(200)

    // Old refresh token should now be invalid
    const refreshResponse = await client
      .post('/auth/refresh')
      .header('cookie', refreshCookie!)

    refreshResponse.assertStatus(401)
  })
})
