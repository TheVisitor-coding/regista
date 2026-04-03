import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    integer,
    pgEnum,
    boolean,
    jsonb,
    index,
    uniqueIndex,
    bigint,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { users } from './users.js'

export const aiProfileEnum = pgEnum('ai_profile', [
    'offensive',
    'balanced',
    'defensive',
])

export const staffRoleEnum = pgEnum('staff_role', [
    'assistant',
    'doctor',
    'sporting_director',
    'secretary',
])

export const notificationCategoryEnum = pgEnum('notification_category', [
    'match',
    'injury',
    'finance',
    'transfer',
    'tactic',
    'system',
])

export const notificationPriorityEnum = pgEnum('notification_priority', [
    'critical',
    'important',
    'warning',
    'info',
    'positive',
])

export const financialTransactionTypeEnum = pgEnum('financial_transaction_type', [
    'ticket_revenue',
    'tv_rights',
    'player_sale',
    'salary',
    'player_purchase',
    'prize',
    'other',
])

export const clubs = pgTable(
    'clubs',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: uuid('user_id')
            .references(() => users.id, { onDelete: 'cascade' }),
        name: varchar('name', { length: 30 }).notNull(),
        primaryColor: varchar('primary_color', { length: 7 }).notNull(),
        secondaryColor: varchar('secondary_color', { length: 7 }).notNull(),
        logoId: varchar('logo_id', { length: 50 }).notNull(),
        stadiumName: varchar('stadium_name', { length: 50 }).notNull(),
        balance: bigint('balance', { mode: 'number' }).notNull(),
        morale: integer('morale').notNull().default(60),
        leagueId: uuid('league_id'),
        divisionId: uuid('division_id'),
        isAi: boolean('is_ai').notNull().default(false),
        aiProfile: aiProfileEnum('ai_profile'),
        nameChangesRemaining: integer('name_changes_remaining').notNull().default(1),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex('clubs_user_id_idx').on(table.userId),
        uniqueIndex('clubs_name_lower_idx').on(sql`lower(${table.name})`),
        index('clubs_league_id_idx').on(table.leagueId),
    ],
)

export const clubStaff = pgTable(
    'club_staff',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        clubId: uuid('club_id')
            .notNull()
            .references(() => clubs.id, { onDelete: 'cascade' }),
        role: staffRoleEnum('role').notNull(),
        firstName: varchar('first_name', { length: 30 }).notNull(),
        lastName: varchar('last_name', { length: 30 }).notNull(),
        avatarId: varchar('avatar_id', { length: 50 }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex('club_staff_club_id_role_idx').on(table.clubId, table.role),
    ],
)

export const notifications = pgTable(
    'notifications',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        clubId: uuid('club_id')
            .notNull()
            .references(() => clubs.id, { onDelete: 'cascade' }),
        staffRole: staffRoleEnum('staff_role').notNull(),
        category: notificationCategoryEnum('category').notNull(),
        priority: notificationPriorityEnum('priority').notNull(),
        title: varchar('title', { length: 100 }).notNull(),
        message: varchar('message', { length: 2000 }).notNull(),
        actionUrl: varchar('action_url', { length: 200 }),
        isRead: boolean('is_read').notNull().default(false),
        isPinned: boolean('is_pinned').notNull().default(false),
        metadata: jsonb('metadata').$type<Record<string, unknown> | null>().default(null),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('notifications_club_id_created_at_idx').on(table.clubId, table.createdAt),
        index('notifications_club_id_is_read_idx').on(table.clubId, table.isRead),
    ],
)

export const financialTransactions = pgTable(
    'financial_transactions',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        clubId: uuid('club_id')
            .notNull()
            .references(() => clubs.id, { onDelete: 'cascade' }),
        type: financialTransactionTypeEnum('type').notNull(),
        amount: bigint('amount', { mode: 'number' }).notNull(),
        description: varchar('description', { length: 200 }).notNull(),
        referenceId: uuid('reference_id'),
        balanceAfter: bigint('balance_after', { mode: 'number' }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('financial_transactions_club_id_created_at_idx').on(table.clubId, table.createdAt),
        index('financial_transactions_club_id_type_idx').on(table.clubId, table.type),
    ],
)
