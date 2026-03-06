import { sqlClient } from './client.js'

async function seed() {
    console.log('Seed scaffold ready (no data inserted yet).')
}

seed()
    .catch((error) => {
        console.error('Seed failed:', error)
        process.exitCode = 1
    })
    .finally(async () => {
        await sqlClient.end({ timeout: 5 })
    })
