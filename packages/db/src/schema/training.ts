import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    jsonb,
    uniqueIndex,
} from 'drizzle-orm/pg-core'
import { clubs } from './clubs.js'

export const trainingPrograms = pgTable(
    'training_programs',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        clubId: uuid('club_id')
            .notNull()
            .references(() => clubs.id, { onDelete: 'cascade' }),
        gkFocus: varchar('gk_focus', { length: 20 }).notNull().default('reflexes'),
        defFocus: varchar('def_focus', { length: 20 }).notNull().default('defensive'),
        midFocus: varchar('mid_focus', { length: 20 }).notNull().default('technical'),
        attFocus: varchar('att_focus', { length: 20 }).notNull().default('technical'),
        individualOverrides: jsonb('individual_overrides').$type<Record<string, string>>().notNull().default({}),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex('training_programs_club_id_idx').on(table.clubId),
    ],
)
