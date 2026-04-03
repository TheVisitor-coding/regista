import { db } from '@regista/db'
import { players, clubs, transferListings } from '@regista/db'
import { and, count, eq } from 'drizzle-orm'
import {
    MIN_SQUAD_SIZE,
    MAX_SIMULTANEOUS_LISTINGS,
    SQUAD_MAX_PLAYERS,
    AI_MARKET_TARGET_COUNT,
    AI_MARKET_EXPIRY_DAYS,
    SALARY_BASE_PER_OVERALL,
    SALARY_RANDOM_BONUS_MAX,
} from '@regista/shared'
import { ValuationService } from './valuation_service.js'
import { TransferExecutor } from './transfer_executor.js'

// Reuse name pools from squad generation
const FIRST_NAMES = ['Lucas', 'Mateo', 'Hugo', 'Leo', 'Nolan', 'Samir', 'Rayan', 'Adam', 'Gabriel', 'Noah', 'Ethan', 'Jules', 'Arthur', 'Louis', 'Nathan', 'Liam', 'Diego', 'Marco', 'Carlos', 'Pedro']
const LAST_NAMES = ['Martin', 'Garcia', 'Lopez', 'Rossi', 'Müller', 'Schmidt', 'Silva', 'Santos', 'Fernandez', 'Nakamura', 'Ali', 'Chen', 'Kim', 'Eriksen', 'Dubois', 'Leroy', 'Girard', 'Moreau', 'Fournier', 'Petit']
const NATIONALITIES = ['FRA', 'ESP', 'ITA', 'DEU', 'BRA', 'ARG', 'PRT', 'NLD', 'BEL', 'GBR', 'JPN', 'KOR', 'MAR', 'SEN', 'COL', 'URY']
const POSITIONS = ['GK', 'GK', 'CB', 'CB', 'CB', 'LB', 'RB', 'CB', 'LB', 'CDM', 'CM', 'CM', 'CM', 'CAM', 'CM', 'CDM', 'LW', 'RW', 'ST', 'ST', 'CF', 'LW', 'RW', 'ST', 'CAM', 'CM'] as const

function pickRandom<T>(arr: readonly T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateOverall(): number {
    const r = Math.random()
    if (r < 0.40) return randomInt(50, 59) // Average
    if (r < 0.76) return randomInt(60, 69) // Good
    if (r < 0.96) return randomInt(70, 79) // Very Good
    return randomInt(80, 89) // Elite
}

export class MarketService {
    static async listPlayer(clubId: string, playerId: string, price: number): Promise<string> {
        // Validate squad size
        const [squadCount] = await db.select({ value: count(players.id) }).from(players).where(eq(players.clubId, clubId))
        if ((squadCount?.value ?? 0) <= MIN_SQUAD_SIZE) {
            throw new Error('Cannot sell: squad would drop below minimum')
        }

        // Check max listings
        const [listingCount] = await db.select({ value: count(transferListings.id) }).from(transferListings)
            .where(and(eq(transferListings.sellerClubId, clubId), eq(transferListings.status, 'active')))
        if ((listingCount?.value ?? 0) >= MAX_SIMULTANEOUS_LISTINGS) {
            throw new Error(`Maximum ${MAX_SIMULTANEOUS_LISTINGS} simultaneous listings`)
        }

        // Verify player belongs to club
        const [player] = await db.select().from(players).where(and(eq(players.id, playerId), eq(players.clubId, clubId))).limit(1)
        if (!player) throw new Error('Player not found in your club')

        const [listing] = await db.insert(transferListings).values({
            playerId,
            sellerClubId: clubId,
            source: 'human_listing',
            price,
            status: 'active',
        }).returning()

        return listing.id
    }

    static async buyListing(buyerClubId: string, listingId: string): Promise<void> {
        const [listing] = await db.select().from(transferListings).where(eq(transferListings.id, listingId)).limit(1)
        if (!listing || listing.status !== 'active') throw new Error('Listing not available')

        // Check buyer squad size
        const [squadCount] = await db.select({ value: count(players.id) }).from(players).where(eq(players.clubId, buyerClubId))
        if ((squadCount?.value ?? 0) >= SQUAD_MAX_PLAYERS) throw new Error('Squad is full')

        // Check buyer balance
        const [buyerClub] = await db.select().from(clubs).where(eq(clubs.id, buyerClubId)).limit(1)
        if (!buyerClub || buyerClub.balance < listing.price) throw new Error('Insufficient funds')

        // Cannot buy own player
        if (listing.sellerClubId === buyerClubId) throw new Error('Cannot buy your own player')

        // Execute transfer
        const type = listing.source === 'ai_market' ? 'market_purchase' : 'human_transfer'
        await TransferExecutor.execute(listing.playerId, listing.sellerClubId, buyerClubId, listing.price, type)

        // Mark listing as sold
        await db.update(transferListings).set({
            status: 'sold',
            soldAt: new Date(),
            buyerClubId,
        }).where(eq(transferListings.id, listingId))
    }

    static async withdrawListing(listingId: string, clubId: string): Promise<void> {
        const [listing] = await db.select().from(transferListings).where(eq(transferListings.id, listingId)).limit(1)
        if (!listing || listing.sellerClubId !== clubId) throw new Error('Listing not found')
        if (listing.status !== 'active') throw new Error('Listing is not active')

        // Check 24h minimum
        const listedAt = listing.listedAt.getTime()
        const now = Date.now()
        if (now - listedAt < 24 * 60 * 60 * 1000) throw new Error('Cannot withdraw before 24 hours')

        await db.update(transferListings).set({ status: 'withdrawn' }).where(eq(transferListings.id, listingId))
    }

    /**
     * Generate AI market players to reach target count.
     */
    static async generateAiMarketPlayers(): Promise<number> {
        // Count current active AI listings
        const [current] = await db.select({ value: count(transferListings.id) }).from(transferListings)
            .where(and(eq(transferListings.source, 'ai_market'), eq(transferListings.status, 'active')))

        const needed = AI_MARKET_TARGET_COUNT - (current?.value ?? 0)
        if (needed <= 0) return 0

        const expiresAt = new Date(Date.now() + AI_MARKET_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

        for (let i = 0; i < needed; i++) {
            const position = pickRandom(POSITIONS)
            const overall = generateOverall()
            const potential = Math.min(95, overall + randomInt(3, 15))
            const age = randomInt(18, 33)
            const salary = overall * SALARY_BASE_PER_OVERALL + randomInt(0, SALARY_RANDOM_BONUS_MAX)

            // Create player (no club)
            const [player] = await db.insert(players).values({
                clubId: null,
                firstName: pickRandom(FIRST_NAMES),
                lastName: pickRandom(LAST_NAMES),
                nationality: pickRandom(NATIONALITIES),
                age,
                position: position as any,
                secondaryPositions: [],
                overall,
                potential,
                fatigue: 0,
                contractMatchesRemaining: 0,
                weeklySalary: salary,
                releaseClause: 0,
            }).returning()

            // Generate stats using existing service pattern
            // For simplicity, insert basic stats
            const { playerStats: playerStatsTable } = await import('@regista/db')
            await db.insert(playerStatsTable).values({
                playerId: player.id,
                pace: overall + randomInt(-8, 8),
                stamina: overall + randomInt(-8, 8),
                strength: overall + randomInt(-8, 8),
                agility: overall + randomInt(-8, 8),
                passing: overall + randomInt(-8, 8),
                shooting: overall + randomInt(-8, 8),
                dribbling: overall + randomInt(-8, 8),
                crossing: overall + randomInt(-8, 8),
                heading: overall + randomInt(-8, 8),
                vision: overall + randomInt(-8, 8),
                composure: overall + randomInt(-8, 8),
                workRate: overall + randomInt(-8, 8),
                positioning: overall + randomInt(-8, 8),
                tackling: overall + randomInt(-8, 8),
                marking: overall + randomInt(-8, 8),
                penalties: overall + randomInt(-10, 5),
                freeKick: overall + randomInt(-10, 5),
            })

            const price = ValuationService.calculateAiPrice(overall, age, potential, position as any)

            await db.insert(transferListings).values({
                playerId: player.id,
                sellerClubId: null,
                source: 'ai_market',
                price,
                status: 'active',
                expiresAt,
            })
        }

        return needed
    }
}
