import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { clubs, divisions, leagues, matches, seasons } from '@regista/db'
import { and, asc, eq, inArray } from 'drizzle-orm'
import { StandingsService } from './standings_service.js'

async function getClubWithDivision(userId: string) {
    const [club] = await db
        .select({
            id: clubs.id,
            divisionId: clubs.divisionId,
            leagueId: clubs.leagueId,
        })
        .from(clubs)
        .where(eq(clubs.userId, userId))
        .limit(1)
    return club ?? null
}

async function getCompetitionContext(divisionId: string) {
    const [division] = await db
        .select()
        .from(divisions)
        .where(eq(divisions.id, divisionId))
        .limit(1)

    if (!division) return null

    const [league] = await db
        .select()
        .from(leagues)
        .where(eq(leagues.id, division.leagueId))
        .limit(1)

    const [season] = await db
        .select()
        .from(seasons)
        .where(and(eq(seasons.divisionId, divisionId), eq(seasons.status, 'in_progress')))
        .limit(1)

    return { division, league, season }
}

export default class CompetitionController {
    async info({ auth, response }: HttpContext) {
        const club = await getClubWithDivision(auth.userId)
        if (!club?.divisionId) {
            return response.notFound({ error: 'NO_DIVISION', message: 'You are not assigned to a division' })
        }

        const ctx = await getCompetitionContext(club.divisionId)
        if (!ctx || !ctx.league || !ctx.season) {
            return response.notFound({ error: 'NO_COMPETITION_DATA' })
        }

        return response.ok({
            league: { id: ctx.league.id, name: ctx.league.name },
            division: { id: ctx.division.id, name: ctx.division.name, level: ctx.division.level },
            season: {
                id: ctx.season.id,
                number: ctx.season.number,
                status: ctx.season.status,
                currentMatchday: ctx.season.currentMatchday,
                totalMatchdays: ctx.season.totalMatchdays,
            },
        })
    }

    async standings({ auth, response }: HttpContext) {
        const club = await getClubWithDivision(auth.userId)
        if (!club?.divisionId) {
            return response.notFound({ error: 'NO_DIVISION' })
        }
        const ctx = await getCompetitionContext(club.divisionId)
        if (!ctx?.season) {
            return response.notFound({ error: 'NO_SEASON' })
        }

        const standingsData = await StandingsService.getStandings(ctx.season.id, club.id)

        return response.ok({
            league: { id: ctx.league!.id, name: ctx.league!.name },
            division: { id: ctx.division.id, name: ctx.division.name, level: ctx.division.level },
            season: {
                id: ctx.season.id,
                number: ctx.season.number,
                status: ctx.season.status,
                currentMatchday: ctx.season.currentMatchday,
                totalMatchdays: ctx.season.totalMatchdays,
            },
            standings: standingsData,
        })
    }

    async matchday({ auth, params, response }: HttpContext) {
        const club = await getClubWithDivision(auth.userId)
        if (!club?.divisionId) {
            return response.notFound({ error: 'NO_DIVISION' })
        }

        const matchdayNumber = Number(params.number)
        if (!matchdayNumber || matchdayNumber < 1 || matchdayNumber > 38) {
            return response.badRequest({ error: 'INVALID_MATCHDAY' })
        }

        const ctx = await getCompetitionContext(club.divisionId)
        if (!ctx?.season) {
            return response.notFound({ error: 'NO_SEASON' })
        }

        // Get matches for this matchday with club info
        const matchRows = await db
            .select({
                match: matches,
                homeClub: {
                    id: clubs.id,
                    name: clubs.name,
                    logoId: clubs.logoId,
                    primaryColor: clubs.primaryColor,
                },
            })
            .from(matches)
            .innerJoin(clubs, eq(matches.homeClubId, clubs.id))
            .where(
                and(
                    eq(matches.seasonId, ctx.season.id),
                    eq(matches.matchday, matchdayNumber),
                ),
            )
            .orderBy(asc(matches.scheduledAt))

        // Need away club info too — separate query to avoid complex join
        const awayClubIds = matchRows.map((r) => r.match.awayClubId)
        const awayClubs = awayClubIds.length > 0
            ? await db
                .select({ id: clubs.id, name: clubs.name, logoId: clubs.logoId, primaryColor: clubs.primaryColor })
                .from(clubs)
                .where(inArray(clubs.id, awayClubIds))
            : []

        const awayClubMap = new Map(awayClubs.map((c) => [c.id, c]))

        return response.ok({
            matchday: matchdayNumber,
            matches: matchRows.map((r) => ({
                id: r.match.id,
                seasonId: r.match.seasonId,
                matchday: r.match.matchday,
                homeClub: r.homeClub,
                awayClub: awayClubMap.get(r.match.awayClubId) ?? {
                    id: r.match.awayClubId,
                    name: 'Unknown',
                    logoId: '',
                    primaryColor: '#666',
                },
                scheduledAt: r.match.scheduledAt.toISOString(),
                status: r.match.status,
                homeScore: r.match.homeScore,
                awayScore: r.match.awayScore,
            })),
        })
    }
}
