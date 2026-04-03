import { db } from '@regista/db'
import {
    seasons, standings, seasonResults, clubs, players, divisions, matches,
} from '@regista/db'
import { and, asc, eq } from 'drizzle-orm'
import {
    PRIZE_MONEY,
    PROMOTION_ZONE,
    RELEGATION_ZONE_START,
    CLUBS_PER_DIVISION,
} from '@regista/shared'
import { CalendarService } from './calendar_service.js'
import { StandingsService } from './standings_service.js'
import { NotificationService } from '../notifications/notification_service.js'
import { FinanceService } from '../finances/finance_service.js'

export class SeasonLifecycleService {
    /**
     * Finish a season: archive results, distribute prizes.
     */
    static async finishSeason(seasonId: string) {
        // Get final standings
        const finalStandings = await db
            .select()
            .from(standings)
            .where(eq(standings.seasonId, seasonId))
            .orderBy(asc(standings.position))

        // Save season results
        for (const standing of finalStandings) {
            const prize = PRIZE_MONEY[standing.position] ?? 0

            await db.insert(seasonResults).values({
                seasonId,
                clubId: standing.clubId,
                finalPosition: standing.position,
                points: standing.points,
                promoted: standing.position <= PROMOTION_ZONE,
                relegated: standing.position >= RELEGATION_ZONE_START,
                champion: standing.position === 1,
                prizeMoney: prize,
            })

            // Distribute prize money
            if (prize > 0) {
                await FinanceService.createTransaction(standing.clubId, {
                    type: 'prize',
                    amount: prize,
                    description: `Season prize - Position ${standing.position}`,
                })
            }
        }

        // Update season status
        await db.update(seasons).set({
            status: 'finishing',
            finishedAt: new Date(),
        }).where(eq(seasons.id, seasonId))

        // Notify human clubs
        for (const standing of finalStandings) {
            const [club] = await db.select().from(clubs).where(eq(clubs.id, standing.clubId)).limit(1)
            if (club && !club.isAi) {
                await NotificationService.create(standing.clubId, {
                    staffRole: 'secretary',
                    category: 'system',
                    priority: standing.position === 1 ? 'positive' : 'info',
                    title: standing.position === 1
                        ? 'Champions! Season finished!'
                        : `Season finished - Position ${standing.position}`,
                    message: `Final standings: Position ${standing.position} with ${standing.points} points.`,
                    actionUrl: '/competition',
                })
            }
        }
    }

    /**
     * Run the intersaison: promotions/relegations, age players, reset cards, generate new season.
     */
    static async runIntersaison(leagueId: string) {
        // Get all divisions for this league
        const leagueDivisions = await db
            .select()
            .from(divisions)
            .where(eq(divisions.leagueId, leagueId))
            .orderBy(asc(divisions.level))

        if (leagueDivisions.length < 2) return

        // Get finished seasons
        const seasonMap = new Map<string, typeof seasons.$inferSelect>()
        for (const div of leagueDivisions) {
            const [season] = await db.select().from(seasons)
                .where(and(eq(seasons.divisionId, div.id), eq(seasons.status, 'finishing')))
                .limit(1)
            if (season) seasonMap.set(div.id, season)
        }

        // Process promotions/relegations
        for (let i = 0; i < leagueDivisions.length - 1; i++) {
            const upperDiv = leagueDivisions[i]
            const lowerDiv = leagueDivisions[i + 1]
            const upperSeason = seasonMap.get(upperDiv.id)
            const lowerSeason = seasonMap.get(lowerDiv.id)

            if (!upperSeason || !lowerSeason) continue

            // Get relegated from upper (positions 18-20)
            const relegated = await db.select().from(standings)
                .where(and(eq(standings.seasonId, upperSeason.id)))
                .orderBy(asc(standings.position))

            const relegatedClubs = relegated.filter((s) => s.position >= RELEGATION_ZONE_START)

            // Get promoted from lower (positions 1-3)
            const promoted = await db.select().from(standings)
                .where(and(eq(standings.seasonId, lowerSeason.id)))
                .orderBy(asc(standings.position))

            const promotedClubs = promoted.filter((s) => s.position <= PROMOTION_ZONE)

            // Swap divisions
            for (const s of relegatedClubs) {
                await db.update(clubs).set({ divisionId: lowerDiv.id }).where(eq(clubs.id, s.clubId))

                const [club] = await db.select().from(clubs).where(eq(clubs.id, s.clubId)).limit(1)
                if (club && !club.isAi) {
                    await NotificationService.create(s.clubId, {
                        staffRole: 'secretary',
                        category: 'system',
                        priority: 'important',
                        title: `Relegated to ${lowerDiv.name}`,
                        message: `Your club has been relegated to ${lowerDiv.name}. Fight back next season!`,
                    })
                }
            }

            for (const s of promotedClubs) {
                await db.update(clubs).set({ divisionId: upperDiv.id }).where(eq(clubs.id, s.clubId))

                const [club] = await db.select().from(clubs).where(eq(clubs.id, s.clubId)).limit(1)
                if (club && !club.isAi) {
                    await NotificationService.create(s.clubId, {
                        staffRole: 'secretary',
                        category: 'system',
                        priority: 'positive',
                        title: `Promoted to ${upperDiv.name}!`,
                        message: `Congratulations! Your club has been promoted to ${upperDiv.name}!`,
                    })
                }
            }
        }

        // Age all players +1, reset yellow cards
        for (const div of leagueDivisions) {
            const divClubs = await db.select({ id: clubs.id }).from(clubs).where(eq(clubs.divisionId, div.id))
            for (const club of divClubs) {
                await db.update(players).set({
                    age: players.age, // Will use SQL below
                    yellowCardsSeason: 0,
                    updatedAt: new Date(),
                }).where(eq(players.clubId, club.id))

                // Age +1 via raw SQL
                const clubPlayers = await db.select({ id: players.id, age: players.age }).from(players).where(eq(players.clubId, club.id))
                for (const p of clubPlayers) {
                    await db.update(players).set({ age: p.age + 1 }).where(eq(players.id, p.id))
                }
            }
        }

        // Archive old seasons
        for (const [, season] of seasonMap) {
            await db.update(seasons).set({ status: 'archived' }).where(eq(seasons.id, season.id))
        }

        // Create new seasons with calendars
        const startDate = new Date()
        startDate.setDate(startDate.getDate() + 5) // 5 days offseason

        for (const div of leagueDivisions) {
            const oldSeason = seasonMap.get(div.id)
            const newNumber = (oldSeason?.number ?? 0) + 1

            // Get current clubs in this division
            const divClubs = await db.select({ id: clubs.id }).from(clubs).where(eq(clubs.divisionId, div.id))
            const clubIds = divClubs.map((c) => c.id)

            if (clubIds.length !== CLUBS_PER_DIVISION) {
                console.warn(`Division ${div.name} has ${clubIds.length} clubs, expected ${CLUBS_PER_DIVISION}`)
                continue
            }

            // Create season
            const [newSeason] = await db.insert(seasons).values({
                divisionId: div.id,
                number: newNumber,
                status: 'created',
                totalMatchdays: 38,
                currentMatchday: 0,
            }).returning()

            // Generate calendar
            await CalendarService.generateCalendar(newSeason.id, clubIds, '21:00', startDate)

            // Initialize standings
            await StandingsService.initializeStandings(newSeason.id, clubIds)

            // Start season
            await db.update(seasons).set({
                status: 'in_progress',
                startedAt: startDate,
                currentMatchday: 1,
            }).where(eq(seasons.id, newSeason.id))
        }
    }

    /**
     * Check if all matches of a matchday are finished and advance the season.
     */
    static async checkMatchdayComplete(seasonId: string) {
        const [season] = await db.select().from(seasons).where(eq(seasons.id, seasonId)).limit(1)
        if (!season || season.status !== 'in_progress') return

        // Count non-finished matches for current matchday
        const matchdayMatches = await db.select({ id: matches.id, status: matches.status })
            .from(matches)
            .where(and(eq(matches.seasonId, seasonId), eq(matches.matchday, season.currentMatchday)))

        const allFinished = matchdayMatches.every((m) => m.status === 'finished')
        if (!allFinished) return

        // Advance matchday
        const nextMatchday = season.currentMatchday + 1

        if (nextMatchday > season.totalMatchdays) {
            // Season complete
            await SeasonLifecycleService.finishSeason(seasonId)
        } else {
            await db.update(seasons).set({ currentMatchday: nextMatchday }).where(eq(seasons.id, seasonId))
        }
    }
}
