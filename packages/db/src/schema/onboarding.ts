import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    boolean,
    integer,
    uniqueIndex,
} from 'drizzle-orm/pg-core'
import { users } from './users.js'

export const onboardingMissions = pgTable(
    'onboarding_missions',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        missionKey: varchar('mission_key', { length: 50 }).notNull(),
        completedAt: timestamp('completed_at', { withTimezone: true }),
        rewardClaimed: boolean('reward_claimed').notNull().default(false),
        rewardAmount: integer('reward_amount').notNull().default(0),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex('onboarding_missions_user_key_idx').on(table.userId, table.missionKey),
    ],
)
