import type { HttpContext } from '@adonisjs/core/http'
import { db } from '@regista/db'
import { clubs, players, transferOffers } from '@regista/db'
import { desc, eq } from 'drizzle-orm'
import { makeOfferValidator, counterOfferValidator } from './transfer_validator.js'
import { OfferService } from './offer_service.js'

async function getClubId(userId: string): Promise<string | null> {
    const [club] = await db.select({ id: clubs.id }).from(clubs).where(eq(clubs.userId, userId)).limit(1)
    return club?.id ?? null
}

function formatOffer(offer: typeof transferOffers.$inferSelect) {
    return {
        id: offer.id,
        playerId: offer.playerId,
        fromClubId: offer.fromClubId,
        toClubId: offer.toClubId,
        amount: offer.amount,
        status: offer.status,
        counterAmount: offer.counterAmount,
        counterStatus: offer.counterStatus,
        expiresAt: offer.expiresAt.toISOString(),
        createdAt: offer.createdAt.toISOString(),
    }
}

export default class OfferController {
    async create({ auth, request, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const data = await makeOfferValidator.validate(request.all())

        try {
            const amountCents = data.amount * 100
            const offerId = await OfferService.makeOffer(clubId, data.playerId, amountCents)
            return response.created({ offerId })
        } catch (err: any) {
            return response.badRequest({ error: 'OFFER_FAILED', message: err.message })
        }
    }

    async sent({ auth, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const offers = await db
            .select({
                offer: transferOffers,
                player: { firstName: players.firstName, lastName: players.lastName, position: players.position, overall: players.overall },
            })
            .from(transferOffers)
            .innerJoin(players, eq(transferOffers.playerId, players.id))
            .where(eq(transferOffers.fromClubId, clubId))
            .orderBy(desc(transferOffers.createdAt))

        return response.ok({
            offers: offers.map((o) => ({ ...formatOffer(o.offer), player: o.player })),
            total: offers.length,
        })
    }

    async received({ auth, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const offers = await db
            .select({
                offer: transferOffers,
                player: { firstName: players.firstName, lastName: players.lastName, position: players.position, overall: players.overall },
                fromClub: { id: clubs.id, name: clubs.name },
            })
            .from(transferOffers)
            .innerJoin(players, eq(transferOffers.playerId, players.id))
            .innerJoin(clubs, eq(transferOffers.fromClubId, clubs.id))
            .where(eq(transferOffers.toClubId, clubId))
            .orderBy(desc(transferOffers.createdAt))

        return response.ok({
            offers: offers.map((o) => ({ ...formatOffer(o.offer), player: o.player, fromClub: o.fromClub })),
            total: offers.length,
        })
    }

    async accept({ auth, params, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        try {
            await OfferService.acceptOffer(params.id, clubId)
            return response.ok({ success: true })
        } catch (err: any) {
            return response.badRequest({ error: 'ACCEPT_FAILED', message: err.message })
        }
    }

    async reject({ auth, params, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        try {
            await OfferService.rejectOffer(params.id, clubId)
            return response.ok({ success: true })
        } catch (err: any) {
            return response.badRequest({ error: 'REJECT_FAILED', message: err.message })
        }
    }

    async counter({ auth, params, request, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        const data = await counterOfferValidator.validate(request.all())

        try {
            await OfferService.counterOffer(params.id, clubId, data.amount * 100)
            return response.ok({ success: true })
        } catch (err: any) {
            return response.badRequest({ error: 'COUNTER_FAILED', message: err.message })
        }
    }

    async cancel({ auth, params, response }: HttpContext) {
        const clubId = await getClubId(auth.userId)
        if (!clubId) return response.notFound({ error: 'CLUB_NOT_FOUND' })

        try {
            await OfferService.cancelOffer(params.id, clubId)
            return response.ok({ success: true })
        } catch (err: any) {
            return response.badRequest({ error: 'CANCEL_FAILED', message: err.message })
        }
    }
}
