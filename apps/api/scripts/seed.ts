/**
 * Full seed script — creates a complete game environment:
 * - 1 dev user
 * - 1 human club (Division 3) with 22 players
 * - 1 league with 3 divisions × 20 clubs (59 AI + 1 human)
 * - 38-day calendars for each division
 * - 4 pre-simulated matchdays with standings
 *
 * Usage: pnpm seed
 */

import {
    truncateAll,
    seedBlacklist,
    createDevUser,
    createHumanClub,
    simulateMatchdays,
    closeDb,
    db,
} from './seed-utils.js'
import { LeagueService } from '../app/competition/league_service.js'
import { seasons, standings, clubs, players } from '@regista/db'
import { eq, asc } from 'drizzle-orm'

async function seed() {
    const start = Date.now()
    console.log('🌱 Full seed starting...\n')

    // 1. Clean slate
    await truncateAll()

    // 2. Blacklist
    await seedBlacklist()

    // 3. Dev user
    const userId = await createDevUser()

    // 4. Human club
    const clubId = await createHumanClub(userId)

    // 5. Full league (59 AI clubs + calendars + standings)
    console.log('  Creating league (3 divisions, 59 AI clubs)...')
    const leagueId = await LeagueService.createLeague(clubId)
    console.log(`  League created: ${leagueId}`)

    // 6. Simulate 4 matchdays
    await simulateMatchdays(4)

    // 7. Print summary
    console.log('\n--- SEED SUMMARY ---')
    console.log('Credentials: dev / dev@regista.local / password123')

    const clubCount = await db.select({ id: clubs.id }).from(clubs)
    const playerCount = await db.select({ id: players.id }).from(players)
    console.log(`Clubs: ${clubCount.length}`)
    console.log(`Players: ${playerCount.length}`)

    const allSeasons = await db.select().from(seasons).where(eq(seasons.status, 'in_progress'))
    for (const s of allSeasons) {
        console.log(`\nSeason ${s.id} — Matchday ${s.currentMatchday}`)
        const top5 = await db.select({
            position: standings.position,
            clubId: standings.clubId,
            played: standings.played,
            points: standings.points,
            gd: standings.goalDifference,
        }).from(standings)
            .where(eq(standings.seasonId, s.id))
            .orderBy(asc(standings.position))
            .limit(5)

        for (const row of top5) {
            const [club] = await db.select({ name: clubs.name }).from(clubs).where(eq(clubs.id, row.clubId)).limit(1)
            console.log(`  ${row.position}. ${club?.name ?? '?'} — ${row.played}P ${row.points}pts (GD ${row.gd >= 0 ? '+' : ''}${row.gd})`)
        }
    }

    const elapsed = ((Date.now() - start) / 1000).toFixed(1)
    console.log(`\n🌱 Seed complete in ${elapsed}s`)
}

seed()
    .catch((error) => {
        console.error('Seed failed:', error)
        process.exitCode = 1
    })
    .finally(() => closeDb())
