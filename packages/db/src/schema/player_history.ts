import {
    pgTable,
    uuid,
    timestamp,
    integer,
    uniqueIndex,
} from 'drizzle-orm/pg-core'
import { players } from './players.js'
import { seasons } from './competition.js'

export const playerOverallHistory = pgTable(
    'player_overall_history',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        playerId: uuid('player_id')
            .notNull()
            .references(() => players.id, { onDelete: 'cascade' }),
        seasonId: uuid('season_id')
            .notNull()
            .references(() => seasons.id, { onDelete: 'cascade' }),
        matchday: integer('matchday').notNull(),
        overall: integer('overall').notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex('player_overall_history_unique_idx').on(table.playerId, table.seasonId, table.matchday),
    ],
)
