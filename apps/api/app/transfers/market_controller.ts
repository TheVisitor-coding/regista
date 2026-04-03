import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { clubs, players, transferListings, freeAgents } from '@regista/db'
import { and, count, desc, eq } from 'drizzle-orm'
import { sellPlayerValidator, marketQueryValidator } from './transfer_validator.js'
import { MarketService } from './market_service.js'
import { FreeAgentService } from './free_agent_service.js'

async function getClubId(userId: string): Promise<string | null> {
    const [club] = await db.select({ id: clubs.id }).from(clubs).where(eq(clubs.userId, userId)).limit(1)
    return club?.id ?? null
}

export default class MarketController {
    async index({ request, response }: HttpContext) {
        const params = await marketQueryValidator.validate(request.qs())
        const page = params.page ?? 1
        const limit = params.limit ?? 20
        const offset = (page - 1) * limit

        const conditions = [eq(transferListings.status, 'active')]

        if (params.source) {
            conditions.push(eq(transferListings.source, params.source as any))
        }

        // Get listings with player data
        const listings = await db
            .select({
                listing: transferListings,
                player: {
                    firstName: players.firstName,
                    lastName: players.lastName,
                    position: players.position,
                    overall: players.overall,
                    potential: players.potential,
                    age: players.age,
                    nationality: players.nationality,
                },
            })
            .from(transferListings)
            .innerJoin(players, eq(transferListings.playerId, players.id))
            .where(and(...conditions))
            .orderBy(desc(transferListings.createdAt))
            .limit(limit)
            .offset(offset)

        const [totalResult] = await db
            .select({ value: count(transferListings.id) })
            .from(transferListings)
            .where(and(...conditions))

        return response.ok({
            listings: listings.map((l) => ({
                id: l.listing.id,
                playerId: l.listing.playerId,
                sellerClubId: l.listing.sellerClubId,
                source: l.listing.source,
                price: l.listing.price,
                status: l.listing.status,
                listedAt: l.listing.listedAt.toISOString(),
                expiresAt: l.listing.expiresAt?.toISOString() ?? null,
                player: l.player,
            })),
            total: totalResult?.value ?? 0,
            page,
            limit,
        })
    }

    async show({ params, response }: HttpContext) {
        const [result] = await db
            .select({
                listing: transferListings,
                player: {
                    firstName: players.firstName,
                    lastName: players.lastName,
                    position: players.position,
                    overall: players.overall,
                    potential: players.potential,
                    age: players.age,
                    nationality: players.nationality,
                },
            })
            .from(transferListings)
            .innerJoin(players, eq(transferListings.playerId, players.id))
            .where(eq(transferListings.id, params.listingId))
            .limit(1)

        if (!result) return response.notFound({ error: 'LISTING_NOT_FOUND' })

        return response.ok({
            listing: {
                ...result.listing,
                listedAt: result.listing.listedAt.toISOString(),
                expiresAt: result.listing.expiresAt?.toISOString() ?? null,
                createdAt: result.listing.createdAt.toISOString(),
            },
            player: result.player,
        })
    }

    async buy({ auth, params, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        try {
            await MarketService.buyListing(clubId, params.listingId)
            return response.ok({ success: true })
        } catch (err: any) {
            return response.badRequest({ error: 'PURCHASE_FAILED', message: err.message })
        }
    }

    async sell({ auth, request, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const data = await sellPlayerValidator.validate(request.all())

        try {
            // Price in cents
            const priceCents = data.price * 100
            const listingId = await MarketService.listPlayer(clubId, data.playerId, priceCents)
            return response.created({ listingId })
        } catch (err: any) {
            return response.badRequest({ error: 'LISTING_FAILED', message: err.message })
        }
    }

    async withdraw({ auth, params, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        try {
            await MarketService.withdrawListing(params.listingId, clubId)
            return response.ok({ success: true })
        } catch (err: any) {
            return response.badRequest({ error: 'WITHDRAW_FAILED', message: err.message })
        }
    }

    async myListings({ auth, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const listings = await db
            .select({
                listing: transferListings,
                player: {
                    firstName: players.firstName,
                    lastName: players.lastName,
                    position: players.position,
                    overall: players.overall,
                },
            })
            .from(transferListings)
            .innerJoin(players, eq(transferListings.playerId, players.id))
            .where(and(eq(transferListings.sellerClubId, clubId), eq(transferListings.status, 'active')))

        return response.ok({
            listings: listings.map((l) => ({
                id: l.listing.id,
                playerId: l.listing.playerId,
                price: l.listing.price,
                listedAt: l.listing.listedAt.toISOString(),
                player: l.player,
            })),
        })
    }

    async freeAgentsList({ response }: HttpContext) {
        const agents = await db
            .select({
                freeAgent: freeAgents,
                player: {
                    firstName: players.firstName,
                    lastName: players.lastName,
                    position: players.position,
                    overall: players.overall,
                    age: players.age,
                    nationality: players.nationality,
                },
            })
            .from(freeAgents)
            .innerJoin(players, eq(freeAgents.playerId, players.id))
            .orderBy(desc(players.overall))

        return response.ok({
            freeAgents: agents.map((a) => ({
                id: a.freeAgent.id,
                playerId: a.freeAgent.playerId,
                previousClubId: a.freeAgent.previousClubId,
                reason: a.freeAgent.reason,
                penaltyApplied: a.freeAgent.penaltyApplied,
                expiresAt: a.freeAgent.expiresAt.toISOString(),
                createdAt: a.freeAgent.createdAt.toISOString(),
                player: a.player,
            })),
            total: agents.length,
        })
    }

    async signFreeAgent({ auth, params, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        try {
            await FreeAgentService.signFreeAgent(clubId, params.id)
            return response.ok({ success: true })
        } catch (err: any) {
            return response.badRequest({ error: 'SIGN_FAILED', message: err.message })
        }
    }

    async releasePlayer({ auth, params, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        try {
            await FreeAgentService.releasePlayer(clubId, params.playerId)
            return response.ok({ success: true })
        } catch (err: any) {
            return response.badRequest({ error: 'RELEASE_FAILED', message: err.message })
        }
    }
}
