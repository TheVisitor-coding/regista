import { config } from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../../.env') })

import { db, sqlClient } from './client.js'
import { nameBlacklist } from './schema/index.js'

const BLACKLIST_TERMS = [
    'fuck', 'shit', 'ass', 'bitch', 'dick', 'pussy', 'cock', 'cunt', 'nigger', 'nigga',
    'faggot', 'retard', 'whore', 'slut', 'bastard', 'penis', 'vagina',
    'merde', 'putain', 'connard', 'connasse', 'enculé', 'nique', 'salope', 'pute',
    'bite', 'couille', 'chier', 'foutre', 'bordel', 'batard', 'pd', 'ntm',
    'mierda', 'puta', 'cabron', 'pendejo', 'joder', 'coño', 'verga', 'culo',
    'scheiße', 'scheisse', 'arschloch', 'ficken', 'hurensohn', 'wichser',
    'nazi', 'hitler', 'holocaust', 'kkk', 'isis', 'jihad', 'terrorist',
    'genocide', 'slave', 'apartheid',
    'porn', 'hentai', 'xxx', 'rape', 'pedo', 'incest',
]

async function seed() {
    console.log('🌱 Seeding database...')

    const existingTerms = await db.select({ term: nameBlacklist.term }).from(nameBlacklist)
    const existingSet = new Set(existingTerms.map((t) => t.term.toLowerCase()))
    const newTerms = BLACKLIST_TERMS.filter((t) => !existingSet.has(t.toLowerCase()))

    if (newTerms.length > 0) {
        await db.insert(nameBlacklist).values(
            newTerms.map((term) => ({
                term: term.toLowerCase(),
                category: 'offensive',
                language: 'all',
                isRegex: false,
            })),
        )
        console.log(`  ✓ Inserted ${newTerms.length} blacklist terms`)
    } else {
        console.log('  ✓ Blacklist terms already seeded')
    }

    console.log('🌱 Seed complete!')
}

seed()
    .catch((error) => {
        console.error('Seed failed:', error)
        process.exitCode = 1
    })
    .finally(async () => {
        await sqlClient.end({ timeout: 5 })
    })
