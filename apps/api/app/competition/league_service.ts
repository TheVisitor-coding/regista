import { db } from '@regista/db'
import { leagues, divisions, clubs } from '@regista/db'
import { eq } from 'drizzle-orm'
import { CLUBS_PER_DIVISION, DIVISIONS_PER_LEAGUE } from '@regista/shared'
import { AiClubService } from './ai_club_service.js'
import { CalendarService } from './calendar_service.js'
import { SeasonService } from './season_service.js'
import { StandingsService } from './standings_service.js'

const LEAGUE_NAMES = [
    'Ligue Alpha', 'Ligue Beta', 'Ligue Gamma', 'Ligue Delta',
    'Ligue Epsilon', 'Ligue Zeta', 'Ligue Eta', 'Ligue Theta',
    'Ligue Iota', 'Ligue Kappa',
]

const DIVISION_NAMES: Record<number, string> = {
    1: 'Division 1',
    2: 'Division 2',
    3: 'Division 3',
}

function pickRandom<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

export class LeagueService {
    /**
     * Creates a full league for a human club:
     * - 1 league with 3 divisions
     * - 59 AI clubs (19 in Div 1, 20 in Div 2, 19 in Div 3 + the human)
     * - Seasons and calendars for each division
     * - Initial standings
     */
    static async createLeague(humanClubId: string): Promise<string> {
        // Create league
        const [league] = await db
            .insert(leagues)
            .values({
                name: pickRandom(LEAGUE_NAMES),
                matchTime: '21:00',
            })
            .returning()

        // Create 3 divisions
        const divisionIds: string[] = []
        for (let level = 1; level <= DIVISIONS_PER_LEAGUE; level++) {
            const [division] = await db
                .insert(divisions)
                .values({
                    leagueId: league.id,
                    level,
                    name: DIVISION_NAMES[level],
                })
                .returning()
            divisionIds.push(division.id)
        }

        // Assign human club to Division 3
        const humanDivisionId = divisionIds[2] // Division 3
        await db
            .update(clubs)
            .set({
                leagueId: league.id,
                divisionId: humanDivisionId,
            })
            .where(eq(clubs.id, humanClubId))

        // Generate AI clubs for each division
        const allClubsByDivision: Map<string, string[]> = new Map()

        for (let level = 1; level <= DIVISIONS_PER_LEAGUE; level++) {
            const divisionId = divisionIds[level - 1]
            const isHumanDivision = level === 3
            const aiCount = isHumanDivision
                ? CLUBS_PER_DIVISION - 1 // 19 AI + 1 human
                : CLUBS_PER_DIVISION     // 20 AI

            const aiClubIds = await AiClubService.generateClubsForDivision(
                divisionId,
                league.id,
                level,
                aiCount,
            )

            const allClubIds = isHumanDivision
                ? [humanClubId, ...aiClubIds]
                : aiClubIds

            allClubsByDivision.set(divisionId, allClubIds)
        }

        // Create seasons and calendars for each division
        const startDate = new Date()
        startDate.setDate(startDate.getDate() + 1) // Start tomorrow

        for (let level = 1; level <= DIVISIONS_PER_LEAGUE; level++) {
            const divisionId = divisionIds[level - 1]
            const clubIds = allClubsByDivision.get(divisionId)!

            // Create season
            const seasonId = await SeasonService.createSeason(divisionId, 1)

            // Generate calendar
            await CalendarService.generateCalendar(
                seasonId,
                clubIds,
                '21:00',
                startDate,
            )

            // Initialize standings
            await StandingsService.initializeStandings(seasonId, clubIds)

            // Start the season
            await SeasonService.startSeason(seasonId)
        }

        return league.id
    }
}
