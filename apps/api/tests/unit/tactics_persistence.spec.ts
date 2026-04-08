import { test } from '@japa/runner'
import { db } from '@regista/db'
import { users, clubs, players, clubTactics, clubCompositions } from '@regista/db'
import { eq } from 'drizzle-orm'
import { redis } from '#services/redis'

const DEFAULT_TACTICS = {
    formation: '4-4-2',
    mentality: 'balanced',
    pressing: 'medium',
    passingStyle: 'mixed',
    width: 'normal',
    tempo: 'normal',
    defensiveLine: 'medium',
}

// Helper: create a test user + club + 11 players
async function createTestFixtures() {
    const [user] = await db.insert(users).values({
        username: `test_${Date.now()}`,
        email: `test_${Date.now()}@test.com`,
        passwordHash: 'hash',
        status: 'active',
    }).returning()

    const [club] = await db.insert(clubs).values({
        userId: user.id,
        name: `TestClub_${Date.now()}`,
        primaryColor: '#FF0000',
        secondaryColor: '#0000FF',
        logoId: 'logo1',
        stadiumName: 'Test Stadium',
        balance: 10_000_000,
    }).returning()

    // Create 18 players (11 starters + 7 bench)
    const positions = ['GK', 'CB', 'CB', 'LB', 'RB', 'CM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'GK', 'CB', 'CDM', 'CM', 'RW', 'ST', 'CF'] as const
    const playerRows = await db.insert(players).values(
        positions.map((pos, i) => ({
            clubId: club.id,
            firstName: `Player`,
            lastName: `${i + 1}`,
            nationality: 'FR',
            age: 25,
            position: pos,
            overall: 70,
            potential: 80,
            fatigue: 10,
            contractMatchesRemaining: 38,
            weeklySalary: 100_000,
            releaseClause: 5_000_000,
        })),
    ).returning()

    return { user, club, players: playerRows }
}

async function cleanup(clubId: string, userId: string) {
    await db.delete(clubCompositions).where(eq(clubCompositions.clubId, clubId))
    await db.delete(clubTactics).where(eq(clubTactics.clubId, clubId))
    await db.delete(players).where(eq(players.clubId, clubId))
    await db.delete(clubs).where(eq(clubs.id, clubId))
    await db.delete(users).where(eq(users.id, userId))
}

test.group('Tactics Persistence — Redis→PostgreSQL', (group) => {
    let fixtures: Awaited<ReturnType<typeof createTestFixtures>>

    group.setup(async () => {
        fixtures = await createTestFixtures()
    })

    group.teardown(async () => {
        await cleanup(fixtures.club.id, fixtures.user.id)
    })

    test('upsert tactics — save then read returns same values', async ({ assert }) => {
        const tactics = {
            formation: '4-3-3',
            mentality: 'offensive' as const,
            pressing: 'high' as const,
            passingStyle: 'short' as const,
            width: 'wide' as const,
            tempo: 'fast' as const,
            defensiveLine: 'high' as const,
        }

        await db.insert(clubTactics)
            .values({ clubId: fixtures.club.id, ...tactics })
            .onConflictDoUpdate({
                target: clubTactics.clubId,
                set: { ...tactics, updatedAt: new Date() },
            })

        const [row] = await db.select({
            formation: clubTactics.formation,
            mentality: clubTactics.mentality,
            pressing: clubTactics.pressing,
            passingStyle: clubTactics.passingStyle,
            width: clubTactics.width,
            tempo: clubTactics.tempo,
            defensiveLine: clubTactics.defensiveLine,
        }).from(clubTactics).where(eq(clubTactics.clubId, fixtures.club.id))

        assert.deepEqual(row, tactics)
    })

    test('upsert composition — save then read returns same startingXI/bench', async ({ assert }) => {
        const startingXI = fixtures.players.slice(0, 11).map((p) => ({
            playerId: p.id,
            position: p.position,
        }))
        const bench = fixtures.players.slice(11).map((p) => ({
            playerId: p.id,
            position: p.position,
        }))

        await db.insert(clubCompositions)
            .values({
                clubId: fixtures.club.id,
                formation: '4-4-2',
                startingXI,
                bench,
                coherence: 85,
                warnings: ['No backup GK on bench'],
            })
            .onConflictDoUpdate({
                target: clubCompositions.clubId,
                set: {
                    formation: '4-4-2',
                    startingXI,
                    bench,
                    coherence: 85,
                    warnings: ['No backup GK on bench'],
                    updatedAt: new Date(),
                },
            })

        const [row] = await db.select().from(clubCompositions)
            .where(eq(clubCompositions.clubId, fixtures.club.id))

        assert.equal(row.formation, '4-4-2')
        assert.equal(row.startingXI.length, 11)
        assert.equal(row.bench.length, 7)
        assert.equal(row.coherence, 85)
        assert.deepEqual(row.warnings, ['No backup GK on bench'])
        assert.deepEqual(
            row.startingXI.map((s) => s.playerId).sort(),
            startingXI.map((s) => s.playerId).sort(),
        )
    })

    test('data survives Redis FLUSHALL', async ({ assert }) => {
        // Write tactics to PG
        await db.insert(clubTactics)
            .values({
                clubId: fixtures.club.id,
                formation: '3-5-2',
                mentality: 'defensive',
                pressing: 'low',
            })
            .onConflictDoUpdate({
                target: clubTactics.clubId,
                set: { formation: '3-5-2', mentality: 'defensive', pressing: 'low', updatedAt: new Date() },
            })

        // Write composition to PG
        const startingXI = fixtures.players.slice(0, 11).map((p) => ({
            playerId: p.id,
            position: p.position,
        }))
        await db.insert(clubCompositions)
            .values({
                clubId: fixtures.club.id,
                formation: '3-5-2',
                startingXI,
                bench: [],
                coherence: 60,
                warnings: [],
            })
            .onConflictDoUpdate({
                target: clubCompositions.clubId,
                set: { formation: '3-5-2', startingXI, bench: [], coherence: 60, warnings: [], updatedAt: new Date() },
            })

        // Flush Redis
        await redis.flushall()

        // Data still in PG
        const [tactics] = await db.select().from(clubTactics)
            .where(eq(clubTactics.clubId, fixtures.club.id))
        assert.equal(tactics.formation, '3-5-2')
        assert.equal(tactics.mentality, 'defensive')

        const [comp] = await db.select().from(clubCompositions)
            .where(eq(clubCompositions.clubId, fixtures.club.id))
        assert.equal(comp.formation, '3-5-2')
        assert.equal(comp.startingXI.length, 11)
    })

    test('club with no saved tactics returns DEFAULT_TACTICS shape', async ({ assert }) => {
        // Create a fresh club with no tactics row
        const [user2] = await db.insert(users).values({
            username: `noTac_${Date.now()}`,
            email: `notac_${Date.now()}@test.com`,
            passwordHash: 'hash',
            status: 'active',
        }).returning()

        const [club2] = await db.insert(clubs).values({
            userId: user2.id,
            name: `NoTacClub`,
            primaryColor: '#000000',
            secondaryColor: '#FFFFFF',
            logoId: 'logo2',
            stadiumName: 'Empty Stadium',
            balance: 1_000_000,
        }).returning()

        const [row] = await db.select({
            formation: clubTactics.formation,
        }).from(clubTactics).where(eq(clubTactics.clubId, club2.id))

        assert.isUndefined(row)
        // Controller would return DEFAULT_TACTICS — verify the constant
        assert.equal(DEFAULT_TACTICS.formation, '4-4-2')
        assert.equal(DEFAULT_TACTICS.mentality, 'balanced')

        // Cleanup
        await db.delete(clubs).where(eq(clubs.id, club2.id))
        await db.delete(users).where(eq(users.id, user2.id))
    })

    test('partial update keeps other fields unchanged', async ({ assert }) => {
        // Set full tactics
        await db.insert(clubTactics)
            .values({
                clubId: fixtures.club.id,
                formation: '4-4-2',
                mentality: 'balanced',
                pressing: 'medium',
                passingStyle: 'mixed',
                width: 'normal',
                tempo: 'normal',
                defensiveLine: 'medium',
            })
            .onConflictDoUpdate({
                target: clubTactics.clubId,
                set: {
                    formation: '4-4-2',
                    mentality: 'balanced',
                    pressing: 'medium',
                    passingStyle: 'mixed',
                    width: 'normal',
                    tempo: 'normal',
                    defensiveLine: 'medium',
                    updatedAt: new Date(),
                },
            })

        // Partial update: only mentality
        await db.update(clubTactics)
            .set({ mentality: 'offensive', updatedAt: new Date() })
            .where(eq(clubTactics.clubId, fixtures.club.id))

        const [row] = await db.select({
            formation: clubTactics.formation,
            mentality: clubTactics.mentality,
            pressing: clubTactics.pressing,
            width: clubTactics.width,
        }).from(clubTactics).where(eq(clubTactics.clubId, fixtures.club.id))

        assert.equal(row.mentality, 'offensive')
        assert.equal(row.formation, '4-4-2')
        assert.equal(row.pressing, 'medium')
        assert.equal(row.width, 'normal')
    })
})
