import { db, sqlClient } from '@regista/db'
import {
    users, clubs, clubStaff, nameBlacklist,
    leagues, matches, seasons,
} from '@regista/db'
import { eq, and, sql } from 'drizzle-orm'
import { hash } from 'bcrypt'
import {
    INITIAL_CLUB_BUDGET_CENTS,
    MORALE_INITIAL,
    SQUAD_INITIAL_OVERALL_MIN,
    SQUAD_INITIAL_OVERALL_MAX,
} from '@regista/shared'
import { SquadGenerationService } from '../app/clubs/squad_generation_service.js'
import { LeagueService } from '../app/competition/league_service.js'
import { MatchEngine } from '../app/match/match_engine.js'
import { SeasonLifecycleService } from '../app/competition/season_lifecycle_service.js'
import {
    updateStandings,
    applyFatigue,
    applyFatigueRecovery,
    processInjuries,
    processSuspensions,
} from '../app/match/post_match_service.js'

// ─── Blacklist terms (from packages/db/src/seed.ts) ──────────────────────────

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

const STAFF_FIRST = ['Marco', 'Pierre', 'Hans', 'Jorge']
const STAFF_LAST = ['Rossi', 'Schmidt', 'Garcia', 'Silva']

// ─── Core functions ──────────────────────────────────────────────────────────

export async function truncateAll() {
    console.log('  Truncating all tables...')
    await db.execute(sql`SET client_min_messages TO WARNING`)
    await db.execute(sql`TRUNCATE TABLE users, leagues, name_blacklist CASCADE`)
    await db.execute(sql`SET client_min_messages TO NOTICE`)
    console.log('  Done.')
}

export async function seedBlacklist() {
    console.log('  Seeding blacklist...')
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
    }
    console.log(`  Blacklist: ${newTerms.length} terms inserted.`)
}

export async function createDevUser(): Promise<string> {
    console.log('  Creating dev user...')
    const passwordHash = await hash('password123', 10)

    const [user] = await db
        .insert(users)
        .values({
            username: 'dev',
            email: 'dev@regista.local',
            passwordHash,
            status: 'active',
            emailVerifiedAt: new Date(),
        })
        .returning()

    console.log(`  User created: ${user.id} (dev / dev@regista.local / password123)`)
    return user.id
}

export async function createHumanClub(userId: string): Promise<string> {
    console.log('  Creating human club...')

    const [club] = await db
        .insert(clubs)
        .values({
            userId,
            name: 'FC Regista Dev',
            primaryColor: '#2E9E5B',
            secondaryColor: '#0D1F14',
            logoId: 'shield-01',
            stadiumName: 'Regista Arena',
            balance: INITIAL_CLUB_BUDGET_CENTS,
            morale: MORALE_INITIAL,
            isAi: false,
        })
        .returning()

    // Generate staff
    const roles = ['assistant', 'doctor', 'sporting_director', 'secretary'] as const
    await db.insert(clubStaff).values(
        roles.map((role, i) => ({
            clubId: club.id,
            role,
            firstName: STAFF_FIRST[i],
            lastName: STAFF_LAST[i],
            avatarId: `${role}-dev-${i + 1}`,
        })),
    )

    // Generate squad (22 players, OVR 55-65 for Div3)
    await SquadGenerationService.generate(club.id, SQUAD_INITIAL_OVERALL_MIN, SQUAD_INITIAL_OVERALL_MAX)

    console.log(`  Club created: ${club.id} (FC Regista Dev)`)
    return club.id
}

export async function simulateMatchdays(numMatchdays: number) {
    console.log(`  Simulating ${numMatchdays} matchdays...`)

    // Find all active seasons
    const activeSeasons = await db
        .select({ id: seasons.id, currentMatchday: seasons.currentMatchday })
        .from(seasons)
        .where(eq(seasons.status, 'in_progress'))

    for (let day = 0; day < numMatchdays; day++) {
        const matchday = activeSeasons[0].currentMatchday + day
        console.log(`    Matchday ${matchday}...`)

        for (const season of activeSeasons) {
            const currentDay = season.currentMatchday + day

            // Get all matches for this matchday
            const matchList = await db
                .select({ id: matches.id })
                .from(matches)
                .where(and(
                    eq(matches.seasonId, season.id),
                    eq(matches.matchday, currentDay),
                ))

            // Prepare all matches
            for (const m of matchList) {
                await MatchEngine.prepareMatch(m.id)
            }

            // Simulate all matches (parallel in batches of 10)
            const BATCH_SIZE = 10
            for (let i = 0; i < matchList.length; i += BATCH_SIZE) {
                const batch = matchList.slice(i, i + BATCH_SIZE)
                await Promise.all(batch.map((m) => MatchEngine.simulateMatch(m.id)))
            }

            // Post-process each match (simplified: standings + fatigue + injuries + suspensions)
            for (const m of matchList) {
                const [match] = await db.select().from(matches).where(eq(matches.id, m.id)).limit(1)
                if (!match || match.homeScore === null || match.awayScore === null) continue

                await updateStandings(match)
                await applyFatigue(match.homeClubId)
                await applyFatigue(match.awayClubId)
                await processInjuries(match.homeClubId)
                await processInjuries(match.awayClubId)
                await processSuspensions(match.homeClubId)
                await processSuspensions(match.awayClubId)
                await applyFatigueRecovery(match.homeClubId)
                await applyFatigueRecovery(match.awayClubId)
            }

            // Advance season matchday
            await SeasonLifecycleService.checkMatchdayComplete(season.id)
        }
    }

    console.log(`  Simulation complete.`)
}

export async function closeDb() {
    await sqlClient.end({ timeout: 5 })
}

export { db }
