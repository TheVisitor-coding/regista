/**
 * Minimal seed — creates only the essentials for testing:
 * - 1 dev user
 * - 1 human club with 22 players
 * - No league, no AI clubs, no calendar
 *
 * Usage: pnpm seed:minimal
 */

import {
    truncateAll,
    seedBlacklist,
    createDevUser,
    createHumanClub,
    closeDb,
} from './seed-utils.js'

async function seedMinimal() {
    const start = Date.now()
    console.log('🌱 Minimal seed starting...\n')

    await truncateAll()
    await seedBlacklist()
    const userId = await createDevUser()
    await createHumanClub(userId)

    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    console.log(`\n🌱 Minimal seed complete in ${elapsed}s`)
    console.log('Credentials: dev / dev@regista.local / password123')
}

seedMinimal()
    .catch((error) => {
        console.error('Seed failed:', error)
        process.exitCode = 1
    })
    .finally(() => closeDb())
