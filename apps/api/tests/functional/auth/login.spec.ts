import { test } from '@japa/runner'
import { db } from '@regista/db'
import { users, emailVerificationTokens, refreshTokens } from '@regista/db'
import { hashPassword } from '../../../app/auth/auth_service.js'

async function createVerifiedUser(username = 'testuser', email = 'test@example.com') {
  const passwordHash = await hashPassword('Password1')
  const [user] = await db.insert(users).values({
    username,
    email,
    passwordHash,
    status: 'active',
    emailVerifiedAt: new Date(),
  }).returning()
  return user
}

test.group('Auth - Login', (group) => {
  group.each.setup(async () => {
    await db.delete(refreshTokens)
    await db.delete(emailVerificationTokens)
    await db.delete(users)
  })

  test('logs in with valid credentials', async ({ client, assert }) => {
    await createVerifiedUser()

    const response = await client.post('/auth/login').json({
      login: 'test@example.com',
      password: 'Password1',
    })

    response.assertStatus(200)

    const body = response.body()
    assert.exists(body.accessToken)
    assert.equal(body.user.username, 'testuser')
  })

  test('logs in by username', async ({ client }) => {
    await createVerifiedUser()

    const response = await client.post('/auth/login').json({
      login: 'testuser',
      password: 'Password1',
    })

    response.assertStatus(200)
  })

  test('rejects wrong password', async ({ client }) => {
    await createVerifiedUser()

    const response = await client.post('/auth/login').json({
      login: 'test@example.com',
      password: 'WrongPass1',
    })

    response.assertStatus(401)
    response.assertBodyContains({ error: 'INVALID_CREDENTIALS' })
  })

  test('returns needsVerification for pending user', async ({ client }) => {
    const passwordHash = await hashPassword('Password1')
    await db.insert(users).values({
      username: 'pending',
      email: 'pending@example.com',
      passwordHash,
      status: 'pending_verification',
    })

    const response = await client.post('/auth/login').json({
      login: 'pending@example.com',
      password: 'Password1',
    })

    response.assertStatus(200)
    response.assertBodyContains({ needsVerification: true })
  })

  test('rejects banned user', async ({ client }) => {
    const passwordHash = await hashPassword('Password1')
    await db.insert(users).values({
      username: 'banned',
      email: 'banned@example.com',
      passwordHash,
      status: 'banned',
    })

    const response = await client.post('/auth/login').json({
      login: 'banned@example.com',
      password: 'Password1',
    })

    response.assertStatus(403)
    response.assertBodyContains({ error: 'ACCOUNT_BANNED' })
  })
})
