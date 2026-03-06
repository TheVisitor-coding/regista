import { test } from '@japa/runner'
import { db } from '@regista/db'
import { users, emailVerificationTokens } from '@regista/db'
import { sql } from 'drizzle-orm'

test.group('Auth - Register', (group) => {
  group.each.setup(async () => {
    await db.delete(emailVerificationTokens)
    await db.delete(users)
  })

  test('registers a new user', async ({ client, assert }) => {
    const response = await client.post('/auth/register').json({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password1',
      passwordConfirmation: 'Password1',
      acceptedTos: true,
      isOver13: true,
    })

    response.assertStatus(201)
    response.assertBodyContains({ needsVerification: true })

    const [user] = await db
      .select()
      .from(users)
      .where(sql`lower(${users.email}) = 'test@example.com'`)

    assert.exists(user)
    assert.equal(user.status, 'pending_verification')
  })

  test('rejects duplicate username', async ({ client }) => {
    await client.post('/auth/register').json({
      username: 'testuser',
      email: 'test1@example.com',
      password: 'Password1',
      passwordConfirmation: 'Password1',
      acceptedTos: true,
      isOver13: true,
    })

    const response = await client.post('/auth/register').json({
      username: 'TestUser',
      email: 'test2@example.com',
      password: 'Password1',
      passwordConfirmation: 'Password1',
      acceptedTos: true,
      isOver13: true,
    })

    response.assertStatus(409)
    response.assertBodyContains({ error: 'USERNAME_TAKEN' })
  })

  test('rejects duplicate email', async ({ client }) => {
    await client.post('/auth/register').json({
      username: 'testuser1',
      email: 'test@example.com',
      password: 'Password1',
      passwordConfirmation: 'Password1',
      acceptedTos: true,
      isOver13: true,
    })

    const response = await client.post('/auth/register').json({
      username: 'testuser2',
      email: 'Test@example.com',
      password: 'Password1',
      passwordConfirmation: 'Password1',
      acceptedTos: true,
      isOver13: true,
    })

    response.assertStatus(409)
    response.assertBodyContains({ error: 'EMAIL_TAKEN' })
  })

  test('rejects reserved username', async ({ client }) => {
    const response = await client.post('/auth/register').json({
      username: 'admin',
      email: 'admin@example.com',
      password: 'Password1',
      passwordConfirmation: 'Password1',
      acceptedTos: true,
      isOver13: true,
    })

    response.assertStatus(409)
    response.assertBodyContains({ error: 'USERNAME_TAKEN' })
  })

  test('rejects weak password', async ({ client }) => {
    const response = await client.post('/auth/register').json({
      username: 'testuser',
      email: 'test@example.com',
      password: 'weak',
      passwordConfirmation: 'weak',
      acceptedTos: true,
      isOver13: true,
    })

    response.assertStatus(422)
  })
})
