import { test } from '@japa/runner'
import { db } from '@regista/db'
import {
    users,
    clubs,
    clubStaff,
    notifications,
    financialTransactions,
} from '@regista/db'
import { eq } from 'drizzle-orm'
import { hashPassword, generateAccessToken } from '../../../app/auth/auth_service.js'

async function createActiveUser(username = 'clubowner', email = 'clubowner@example.com') {
    const passwordHash = await hashPassword('Password1')
    const [user] = await db
        .insert(users)
        .values({
            username,
            email,
            passwordHash,
            status: 'active',
            emailVerifiedAt: new Date(),
        })
        .returning()

    const accessToken = await generateAccessToken({
        sub: user.id,
        username: user.username,
    })

    return { user, accessToken }
}

test.group('Clubs', (group) => {
    group.each.setup(async () => {
        await db.delete(notifications)
        await db.delete(financialTransactions)
        await db.delete(clubStaff)
        await db.delete(clubs)
        await db.delete(users)
    })

    test('creates a club for an authenticated active user', async ({ client, assert }) => {
        const { accessToken, user } = await createActiveUser()

        const response = await client
            .post('/clubs')
            .header('authorization', `Bearer ${accessToken}`)
            .json({
                name: 'FC Regista',
                primaryColor: '#1a5f2a',
                secondaryColor: '#f4f4f5',
                logoId: 'shield-01',
            })

        response.assertStatus(201)
        response.assertBodyContains({
            club: {
                userId: user.id,
                name: 'FC Regista',
                balance: 500000000,
                morale: 60,
            },
        })

        const [club] = await db.select().from(clubs).where(eq(clubs.userId, user.id))
        assert.exists(club)

        const staff = await db.select().from(clubStaff).where(eq(clubStaff.clubId, club.id))
        assert.equal(staff.length, 4)
    })

    test('prevents creating a second club for the same user', async ({ client }) => {
        const { accessToken } = await createActiveUser()

        await client
            .post('/clubs')
            .header('authorization', `Bearer ${accessToken}`)
            .json({
                name: 'FC Regista',
                primaryColor: '#1a5f2a',
                secondaryColor: '#f4f4f5',
                logoId: 'shield-01',
            })

        const secondResponse = await client
            .post('/clubs')
            .header('authorization', `Bearer ${accessToken}`)
            .json({
                name: 'FC Regista 2',
                primaryColor: '#0f172a',
                secondaryColor: '#e2e8f0',
                logoId: 'shield-02',
            })

        secondResponse.assertStatus(409)
        secondResponse.assertBodyContains({ error: 'CLUB_ALREADY_EXISTS' })
    })

    test('returns my club for authenticated user', async ({ client }) => {
        const { accessToken } = await createActiveUser()

        await client
            .post('/clubs')
            .header('authorization', `Bearer ${accessToken}`)
            .json({
                name: 'FC Regista',
                primaryColor: '#1a5f2a',
                secondaryColor: '#f4f4f5',
                logoId: 'shield-01',
            })

        const response = await client
            .get('/clubs/mine')
            .header('authorization', `Bearer ${accessToken}`)

        response.assertStatus(200)
        response.assertBodyContains({ club: { name: 'FC Regista' } })
    })

    test('updates club name and decrements remaining name changes', async ({ client }) => {
        const { accessToken } = await createActiveUser()

        await client
            .post('/clubs')
            .header('authorization', `Bearer ${accessToken}`)
            .json({
                name: 'FC Regista',
                primaryColor: '#1a5f2a',
                secondaryColor: '#f4f4f5',
                logoId: 'shield-01',
            })

        const response = await client
            .patch('/clubs/mine')
            .header('authorization', `Bearer ${accessToken}`)
            .json({
                name: 'Regista United',
            })

        response.assertStatus(200)
        response.assertBodyContains({
            club: {
                name: 'Regista United',
                nameChangesRemaining: 0,
            },
        })
    })
})
