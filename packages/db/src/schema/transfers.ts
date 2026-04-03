import {
    pgTable,
    uuid,
    timestamp,
    pgEnum,
    boolean,
    bigint,
    index,
    uniqueIndex,
} from 'drizzle-orm/pg-core'
import { players } from './players.js'
import { clubs } from './clubs.js'

// Enums

export const transferListingSourceEnum = pgEnum('transfer_listing_source', [
    'ai_market',
    'human_listing',
])

export const transferListingStatusEnum = pgEnum('transfer_listing_status', [
    'active',
    'sold',
    'expired',
    'withdrawn',
])

export const transferOfferStatusEnum = pgEnum('transfer_offer_status', [
    'pending',
    'accepted',
    'rejected',
    'counter_offered',
    'expired',
    'cancelled',
])

export const counterOfferStatusEnum = pgEnum('counter_offer_status', [
    'pending',
    'accepted',
    'rejected',
    'expired',
])

export const transferTypeEnum = pgEnum('transfer_type', [
    'market_purchase',
    'human_transfer',
    'release_clause',
    'free_agent',
    'released',
    'contract_expired',
    'club_deleted',
])

export const freeAgentReasonEnum = pgEnum('free_agent_reason', [
    'released',
    'contract_expired',
    'club_deleted',
])

// Tables

export const transferListings = pgTable(
    'transfer_listings',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        playerId: uuid('player_id')
            .notNull()
            .references(() => players.id, { onDelete: 'cascade' }),
        sellerClubId: uuid('seller_club_id')
            .references(() => clubs.id, { onDelete: 'set null' }),
        source: transferListingSourceEnum('source').notNull(),
        price: bigint('price', { mode: 'number' }).notNull(),
        status: transferListingStatusEnum('status').notNull().default('active'),
        listedAt: timestamp('listed_at', { withTimezone: true }).notNull().defaultNow(),
        soldAt: timestamp('sold_at', { withTimezone: true }),
        buyerClubId: uuid('buyer_club_id')
            .references(() => clubs.id, { onDelete: 'set null' }),
        expiresAt: timestamp('expires_at', { withTimezone: true }),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('transfer_listings_status_idx').on(table.status),
        index('transfer_listings_source_status_idx').on(table.source, table.status),
        index('transfer_listings_seller_idx').on(table.sellerClubId),
        index('transfer_listings_expires_idx').on(table.expiresAt),
    ],
)

export const transferOffers = pgTable(
    'transfer_offers',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        playerId: uuid('player_id')
            .notNull()
            .references(() => players.id, { onDelete: 'cascade' }),
        fromClubId: uuid('from_club_id')
            .notNull()
            .references(() => clubs.id, { onDelete: 'cascade' }),
        toClubId: uuid('to_club_id')
            .notNull()
            .references(() => clubs.id, { onDelete: 'cascade' }),
        amount: bigint('amount', { mode: 'number' }).notNull(),
        status: transferOfferStatusEnum('status').notNull().default('pending'),
        parentOfferId: uuid('parent_offer_id'),
        counterAmount: bigint('counter_amount', { mode: 'number' }),
        counterStatus: counterOfferStatusEnum('counter_status'),
        respondedAt: timestamp('responded_at', { withTimezone: true }),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('transfer_offers_from_status_idx').on(table.fromClubId, table.status),
        index('transfer_offers_to_status_idx').on(table.toClubId, table.status),
        index('transfer_offers_player_status_idx').on(table.playerId, table.status),
        index('transfer_offers_expires_idx').on(table.expiresAt),
    ],
)

export const transferHistory = pgTable(
    'transfer_history',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        playerId: uuid('player_id')
            .notNull()
            .references(() => players.id, { onDelete: 'cascade' }),
        fromClubId: uuid('from_club_id')
            .references(() => clubs.id, { onDelete: 'set null' }),
        toClubId: uuid('to_club_id')
            .references(() => clubs.id, { onDelete: 'set null' }),
        type: transferTypeEnum('type').notNull(),
        fee: bigint('fee', { mode: 'number' }).notNull().default(0),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('transfer_history_player_idx').on(table.playerId),
        index('transfer_history_from_idx').on(table.fromClubId),
        index('transfer_history_to_idx').on(table.toClubId),
    ],
)

export const freeAgents = pgTable(
    'free_agents',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        playerId: uuid('player_id')
            .notNull()
            .references(() => players.id, { onDelete: 'cascade' }),
        previousClubId: uuid('previous_club_id')
            .references(() => clubs.id, { onDelete: 'set null' }),
        reason: freeAgentReasonEnum('reason').notNull(),
        penaltyApplied: boolean('penalty_applied').notNull().default(false),
        expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex('free_agents_player_idx').on(table.playerId),
        index('free_agents_expires_idx').on(table.expiresAt),
    ],
)
