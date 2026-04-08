/**
 * Advance N matchdays on an existing seeded database.
 *
 * Usage: pnpm seed:advance 2
 */

import { simulateMatchdays, closeDb } from './seed-utils.js'

const n = parseInt(process.argv[2] ?? '1', 10)

if (isNaN(n) || n < 1) {
    console.error('Usage: pnpm seed:advance <N>  (N >= 1)')
    process.exit(1)
}

async function advance() {
    const start = Date.now()
    console.log(`🌱 Advancing ${n} matchday(s)...\n`)

    await simulateMatchdays(n)

    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    console.log(`\n🌱 Done in ${elapsed}s`)
}

advance()
    .catch((error) => {
        console.error('Advance failed:', error)
        process.exitCode = 1
    })
    .finally(() => closeDb())
