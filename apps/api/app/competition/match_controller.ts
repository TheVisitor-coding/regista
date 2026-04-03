import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { clubs, matches } from '@regista/db'
import { and, asc, count, desc, eq, gte, inArray, lt, or } from 'drizzle-orm'
import { matchListValidator } from './match_validator.js'

async function getClubId(userId: string): Promise<string | null> {
    const [club] = await db
        .select({ id: clubs.id })
        .from(clubs)
        .where(eq(clubs.userId, userId))
        .limit(1)
    return club?.id ?? null
}

function formatMatch(match: typeof matches.$inferSelect, homeClub: any, awayClub: any) {
    return {
        id: match.id,
        seasonId: match.seasonId,
        matchday: match.matchday,
        homeClub,
        awayClub,
        scheduledAt: match.scheduledAt.toISOString(),
        status: match.status,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
    }
}

export default class MatchController {
    async index({ auth, request, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) {
            return response.notFound({ error: 'CLUB_NOT_FOUND' })
        }

        const params = await matchListValidator.validate(request.qs())
        const filter = params.filter ?? 'all'
        const page = params.page ?? 1
        const limit = params.limit ?? 20
        const offset = (page - 1) * limit

        const conditions = [
            or(eq(matches.homeClubId, clubId), eq(matches.awayClubId, clubId)),
        ]

        const now = new Date()
        if (filter === 'upcoming') {
            conditions.push(gte(matches.scheduledAt, now))
        } else if (filter === 'past') {
            conditions.push(lt(matches.scheduledAt, now))
        }

        const orderDirection = filter === 'past' ? desc : asc

        const [totalResult] = await db
            .select({ value: count(matches.id) })
            .from(matches)
            .where(and(...conditions))

        const rows = await db
            .select()
            .from(matches)
            .where(and(...conditions))
            .orderBy(orderDirection(matches.scheduledAt))
            .limit(limit)
            .offset(offset)

        // Fetch club details for all matches
        const clubIds = new Set<string>()
        for (const m of rows) {
            clubIds.add(m.homeClubId)
            clubIds.add(m.awayClubId)
        }

        const clubRows = clubIds.size > 0
            ? await db
                .select({ id: clubs.id, name: clubs.name, logoId: clubs.logoId, primaryColor: clubs.primaryColor })
                .from(clubs)
                .where(inArray(clubs.id, [...clubIds]))
            : []

        const clubMap = new Map(clubRows.map((c) => [c.id, c]))
        const unknownClub = { id: '', name: 'Unknown', logoId: '', primaryColor: '#666' }

        return response.ok({
            matches: rows.map((m) =>
                formatMatch(m, clubMap.get(m.homeClubId) ?? unknownClub, clubMap.get(m.awayClubId) ?? unknownClub),
            ),
            total: totalResult?.value ?? 0,
            page,
            limit,
        })
    }

    async show({ auth, params, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) {
            return response.notFound({ error: 'CLUB_NOT_FOUND' })
        }

        const [match] = await db
            .select()
            .from(matches)
            .where(eq(matches.id, params.matchId))
            .limit(1)

        if (!match) {
            return response.notFound({ error: 'MATCH_NOT_FOUND' })
        }

        const clubRows = await db
            .select({ id: clubs.id, name: clubs.name, logoId: clubs.logoId, primaryColor: clubs.primaryColor })
            .from(clubs)
            .where(inArray(clubs.id, [match.homeClubId, match.awayClubId]))

        const clubMap = new Map(clubRows.map((c) => [c.id, c]))
        const unknownClub = { id: '', name: 'Unknown', logoId: '', primaryColor: '#666' }

        return response.ok({
            match: formatMatch(match, clubMap.get(match.homeClubId) ?? unknownClub, clubMap.get(match.awayClubId) ?? unknownClub),
        })
    }
}
