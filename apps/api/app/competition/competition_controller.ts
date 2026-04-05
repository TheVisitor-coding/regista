import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { clubs, divisions, leagues, matches, seasons, standings, seasonResults, matchPlayerStats, players } from '@regista/db'
import { and, asc, desc, eq, inArray, sql, sum } from 'drizzle-orm'
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

    async scorers({ auth, request, response }: HttpContext) {
        const club = await getClubWithDivision(auth.userId)
        if (!club?.divisionId) return response.notFound({ error: 'NO_DIVISION' })

        const ctx = await getCompetitionContext(club.divisionId)
        if (!ctx?.season) return response.notFound({ error: 'NO_SEASON' })

        const limit = Number(request.qs().limit) || 20

        // Get all matches for this season
        const seasonMatches = await db
            .select({ id: matches.id })
            .from(matches)
            .where(and(eq(matches.seasonId, ctx.season.id), eq(matches.status, 'finished')))

        const matchIds = seasonMatches.map((m) => m.id)
        if (matchIds.length === 0) {
            return response.ok({ scorers: [] })
        }

        // Aggregate goals by player
        const scorerRows = await db
            .select({
                playerId: matchPlayerStats.playerId,
                clubId: matchPlayerStats.clubId,
                totalGoals: sum(matchPlayerStats.goals),
                totalAssists: sum(matchPlayerStats.assists),
                matchCount: sql<number>`count(*)`,
                avgRating: sql<number>`round(avg(${matchPlayerStats.rating})::numeric, 1)`,
            })
            .from(matchPlayerStats)
            .where(inArray(matchPlayerStats.matchId, matchIds))
            .groupBy(matchPlayerStats.playerId, matchPlayerStats.clubId)
            .having(sql`sum(${matchPlayerStats.goals}) > 0`)
            .orderBy(desc(sql`sum(${matchPlayerStats.goals})`))
            .limit(limit)

        // Enrich with player + club names
        const playerIds = scorerRows.map((r) => r.playerId)
        const clubIds = [...new Set(scorerRows.map((r) => r.clubId))]

        const playerRows = playerIds.length > 0
            ? await db.select({ id: players.id, firstName: players.firstName, lastName: players.lastName, position: players.position })
                .from(players).where(inArray(players.id, playerIds))
            : []
        const clubRows = clubIds.length > 0
            ? await db.select({ id: clubs.id, name: clubs.name }).from(clubs).where(inArray(clubs.id, clubIds))
            : []

        const playerMap = new Map(playerRows.map((p) => [p.id, p]))
        const clubMap = new Map(clubRows.map((c) => [c.id, c]))

        return response.ok({
            scorers: scorerRows.map((r) => {
                const p = playerMap.get(r.playerId)
                const c = clubMap.get(r.clubId)
                return {
                    playerId: r.playerId,
                    playerName: p ? `${p.firstName} ${p.lastName}` : 'Unknown',
                    position: p?.position ?? '',
                    clubName: c?.name ?? 'Unknown',
                    clubId: r.clubId,
                    goals: Number(r.totalGoals ?? 0),
                    assists: Number(r.totalAssists ?? 0),
                    matches: Number(r.matchCount ?? 0),
                    avgRating: Number(r.avgRating ?? 0),
                    isCurrentClub: r.clubId === club.id,
                }
            }),
        })
    }

    async positionHistory({ auth, response }: HttpContext) {
        const club = await getClubWithDivision(auth.userId)
        if (!club?.divisionId) return response.notFound({ error: 'NO_DIVISION' })

        const ctx = await getCompetitionContext(club.divisionId)
        if (!ctx?.season) return response.notFound({ error: 'NO_SEASON' })

        // We don't have a position history table, so we reconstruct from standings
        // For now, return current position only (full history would need a tracking table)
        const [standing] = await db.select()
            .from(standings)
            .where(and(eq(standings.seasonId, ctx.season.id), eq(standings.clubId, club.id)))
            .limit(1)

        return response.ok({
            currentPosition: standing?.position ?? null,
            currentMatchday: ctx.season.currentMatchday,
            // Placeholder: full history would require a position_history table
            history: standing ? [{ matchday: ctx.season.currentMatchday, position: standing.position }] : [],
        })
    }

    async seasonHistory({ auth, response }: HttpContext) {
        const club = await getClubWithDivision(auth.userId)
        if (!club?.divisionId) return response.notFound({ error: 'NO_DIVISION' })

        // Get all season results for this club
        const results = await db
            .select({
                seasonResult: seasonResults,
                seasonNumber: seasons.number,
                divisionName: divisions.name,
            })
            .from(seasonResults)
            .innerJoin(seasons, eq(seasonResults.seasonId, seasons.id))
            .innerJoin(divisions, eq(seasons.divisionId, divisions.id))
            .where(eq(seasonResults.clubId, club.id))
            .orderBy(desc(seasons.number))

        return response.ok({
            seasons: results.map((r) => ({
                seasonId: r.seasonResult.seasonId,
                number: r.seasonNumber,
                divisionName: r.divisionName,
                finalPosition: r.seasonResult.finalPosition,
                points: r.seasonResult.points,
                promoted: r.seasonResult.promoted,
                relegated: r.seasonResult.relegated,
                champion: r.seasonResult.champion,
                prizeMoney: r.seasonResult.prizeMoney,
            })),
        })
    }
}
