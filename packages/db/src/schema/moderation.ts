import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    text,
    pgEnum,
    boolean,
    jsonb,
    index,
} from 'drizzle-orm/pg-core'
import { users } from './users.js'
import { clubs } from './clubs.js'

export const reportReasonEnum = pgEnum('report_reason', [
    'offensive_name',
    'cheating',
    'toxic_behavior',
    'other',
])

export const reportStatusEnum = pgEnum('report_status', [
    'pending',
    'reviewed',
    'dismissed',
    'actioned',
])

export const moderationActionTypeEnum = pgEnum('moderation_action_type', [
    'warn',
    'force_rename',
    'suspend',
    'ban',
    'unban',
    'unsuspend',
])

export const moderationReports = pgTable(
    'moderation_reports',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        reporterId: uuid('reporter_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        targetUserId: uuid('target_user_id')
            .references(() => users.id, { onDelete: 'cascade' }),
        targetClubId: uuid('target_club_id')
            .references(() => clubs.id, { onDelete: 'cascade' }),
        reason: reportReasonEnum('reason').notNull(),
        description: text('description'),
        status: reportStatusEnum('status').notNull().default('pending'),
        reviewedBy: uuid('reviewed_by'),
        reviewNote: text('review_note'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    },
    (table) => [
        index('moderation_reports_status_idx').on(table.status),
        index('moderation_reports_target_user_idx').on(table.targetUserId),
    ],
)

export const moderationActions = pgTable(
    'moderation_actions',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        targetUserId: uuid('target_user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        actionType: moderationActionTypeEnum('action_type').notNull(),
        reason: text('reason'),
        metadata: jsonb('metadata').$type<Record<string, unknown> | null>().default(null),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('moderation_actions_target_idx').on(table.targetUserId),
    ],
)

export const nameBlacklist = pgTable(
    'name_blacklist',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        term: varchar('term', { length: 100 }).notNull(),
        category: varchar('category', { length: 30 }).notNull().default('offensive'),
        language: varchar('language', { length: 5 }).notNull().default('all'),
        isRegex: boolean('is_regex').notNull().default(false),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('name_blacklist_term_idx').on(table.term),
    ],
)
