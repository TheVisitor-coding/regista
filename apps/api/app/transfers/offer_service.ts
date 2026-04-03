import { db } from '@regista/db'
import { transferOffers, players, clubs } from '@regista/db'
import { and, count, eq } from 'drizzle-orm'
import {
    MAX_OUTGOING_OFFERS,
    OFFER_EXPIRY_HOURS,
    MIN_OFFER_AMOUNT_CENTS,
} from '@regista/shared'
import { TransferExecutor } from './transfer_executor.js'
import { NotificationService } from '../notifications/notification_service.js'

export class OfferService {
    static async makeOffer(fromClubId: string, playerId: string, amount: number): Promise<string> {
        if (amount < MIN_OFFER_AMOUNT_CENTS) {
            throw new Error(`Minimum offer is ${MIN_OFFER_AMOUNT_CENTS / 100} G$`)
        }

        // Check player exists and belongs to a human club
        const [player] = await db.select().from(players).where(eq(players.id, playerId)).limit(1)
        if (!player || !player.clubId) throw new Error('Player not found')

        const [targetClub] = await db.select().from(clubs).where(eq(clubs.id, player.clubId)).limit(1)
        if (!targetClub) throw new Error('Target club not found')
        if (targetClub.isAi) throw new Error('Cannot make offers on AI club players')
        if (player.clubId === fromClubId) throw new Error('Cannot offer on your own player')

        // Check max active offers
        const [offerCount] = await db.select({ value: count(transferOffers.id) }).from(transferOffers)
            .where(and(eq(transferOffers.fromClubId, fromClubId), eq(transferOffers.status, 'pending')))
        if ((offerCount?.value ?? 0) >= MAX_OUTGOING_OFFERS) {
            throw new Error(`Maximum ${MAX_OUTGOING_OFFERS} active offers`)
        }

        // Check available balance (total balance - reserved funds)
        const [buyerClub] = await db.select().from(clubs).where(eq(clubs.id, fromClubId)).limit(1)
        if (!buyerClub) throw new Error('Club not found')

        const reservedOffers = await db.select({ amount: transferOffers.amount }).from(transferOffers)
            .where(and(eq(transferOffers.fromClubId, fromClubId), eq(transferOffers.status, 'pending')))
        const totalReserved = reservedOffers.reduce((sum, o) => sum + o.amount, 0)
        const available = buyerClub.balance - totalReserved

        if (available < amount) throw new Error('Insufficient available funds')

        // Check release clause
        if (player.releaseClause > 0 && amount >= player.releaseClause) {
            // Auto-execute transfer via release clause
            await TransferExecutor.execute(playerId, player.clubId, fromClubId, player.releaseClause, 'release_clause')

            // Record a completed offer
            const [offer] = await db.insert(transferOffers).values({
                playerId,
                fromClubId,
                toClubId: player.clubId,
                amount: player.releaseClause,
                status: 'accepted',
                respondedAt: new Date(),
                expiresAt: new Date(),
            }).returning()

            return offer.id
        }

        // Create pending offer
        const expiresAt = new Date(Date.now() + OFFER_EXPIRY_HOURS * 60 * 60 * 1000)

        const [offer] = await db.insert(transferOffers).values({
            playerId,
            fromClubId,
            toClubId: player.clubId,
            amount,
            status: 'pending',
            expiresAt,
        }).returning()

        // Notify target club
        await NotificationService.create(player.clubId, {
            staffRole: 'sporting_director',
            category: 'transfer',
            priority: 'important',
            title: `Offer received for ${player.firstName} ${player.lastName}`,
            message: `${buyerClub.name} offers ${(amount / 100).toLocaleString()} G$ for ${player.firstName} ${player.lastName}. You have 48h to respond.`,
            actionUrl: '/transfers',
        })

        return offer.id
    }

    static async acceptOffer(offerId: string, clubId: string): Promise<void> {
        const [offer] = await db.select().from(transferOffers).where(eq(transferOffers.id, offerId)).limit(1)
        if (!offer) throw new Error('Offer not found')
        if (offer.toClubId !== clubId) throw new Error('Not your offer to accept')
        if (offer.status !== 'pending') throw new Error('Offer is not pending')

        await TransferExecutor.execute(offer.playerId, offer.toClubId, offer.fromClubId, offer.amount, 'human_transfer')

        await db.update(transferOffers).set({
            status: 'accepted',
            respondedAt: new Date(),
        }).where(eq(transferOffers.id, offerId))
    }

    static async rejectOffer(offerId: string, clubId: string): Promise<void> {
        const [offer] = await db.select().from(transferOffers).where(eq(transferOffers.id, offerId)).limit(1)
        if (!offer) throw new Error('Offer not found')
        if (offer.toClubId !== clubId) throw new Error('Not your offer to reject')
        if (offer.status !== 'pending') throw new Error('Offer is not pending')

        await db.update(transferOffers).set({
            status: 'rejected',
            respondedAt: new Date(),
        }).where(eq(transferOffers.id, offerId))

        // Notify offerer
        const [player] = await db.select().from(players).where(eq(players.id, offer.playerId)).limit(1)
        if (player) {
            await NotificationService.create(offer.fromClubId, {
                staffRole: 'sporting_director',
                category: 'transfer',
                priority: 'info',
                title: `Offer rejected`,
                message: `Your offer for ${player.firstName} ${player.lastName} was rejected.`,
            })
        }
    }

    static async counterOffer(offerId: string, clubId: string, counterAmount: number): Promise<void> {
        const [offer] = await db.select().from(transferOffers).where(eq(transferOffers.id, offerId)).limit(1)
        if (!offer) throw new Error('Offer not found')
        if (offer.toClubId !== clubId) throw new Error('Not your offer to counter')
        if (offer.status !== 'pending') throw new Error('Offer is not pending')
        if (counterAmount <= offer.amount) throw new Error('Counter must be higher than initial offer')

        const counterExpiresAt = new Date(Date.now() + OFFER_EXPIRY_HOURS * 60 * 60 * 1000)

        await db.update(transferOffers).set({
            status: 'counter_offered',
            counterAmount,
            counterStatus: 'pending',
            expiresAt: counterExpiresAt,
            respondedAt: new Date(),
        }).where(eq(transferOffers.id, offerId))

        // Notify offerer
        const [player] = await db.select().from(players).where(eq(players.id, offer.playerId)).limit(1)
        const [sellerClub] = await db.select().from(clubs).where(eq(clubs.id, clubId)).limit(1)
        if (player) {
            await NotificationService.create(offer.fromClubId, {
                staffRole: 'sporting_director',
                category: 'transfer',
                priority: 'important',
                title: `Counter-offer for ${player.firstName} ${player.lastName}`,
                message: `${sellerClub?.name ?? 'Club'} counter-offers ${(counterAmount / 100).toLocaleString()} G$ for ${player.firstName} ${player.lastName}.`,
                actionUrl: '/transfers',
            })
        }
    }

    static async cancelOffer(offerId: string, clubId: string): Promise<void> {
        const [offer] = await db.select().from(transferOffers).where(eq(transferOffers.id, offerId)).limit(1)
        if (!offer) throw new Error('Offer not found')
        if (offer.fromClubId !== clubId) throw new Error('Not your offer to cancel')
        if (offer.status !== 'pending') throw new Error('Can only cancel pending offers')

        await db.update(transferOffers).set({ status: 'cancelled' }).where(eq(transferOffers.id, offerId))
    }
}
