import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    boolean,
    integer,
    jsonb,
    index,
    uniqueIndex,
} from 'drizzle-orm/pg-core'
import { clubs } from './clubs.js'
import { players } from './players.js'
import {
    mentalityEnum,
    tacticLevelEnum,
    passingStyleEnum,
    widthEnum,
    tempoEnum,
} from './match_detail.js'

export const tacticalPresets = pgTable(
    'tactical_presets',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        clubId: uuid('club_id')
            .notNull()
            .references(() => clubs.id, { onDelete: 'cascade' }),
        name: varchar('name', { length: 20 }).notNull(),
        formation: varchar('formation', { length: 10 }).notNull(),
        mentality: mentalityEnum('mentality').notNull().default('balanced'),
        pressing: tacticLevelEnum('pressing').notNull().default('medium'),
        passingStyle: passingStyleEnum('passing_style').notNull().default('mixed'),
        width: widthEnum('width').notNull().default('normal'),
        tempo: tempoEnum('tempo').notNull().default('normal'),
        defensiveLine: tacticLevelEnum('defensive_line').notNull().default('medium'),
        penaltyTakerId: uuid('penalty_taker_id').references(() => players.id, { onDelete: 'set null' }),
        freeKickTakerId: uuid('free_kick_taker_id').references(() => players.id, { onDelete: 'set null' }),
        cornerLeftTakerId: uuid('corner_left_taker_id').references(() => players.id, { onDelete: 'set null' }),
        cornerRightTakerId: uuid('corner_right_taker_id').references(() => players.id, { onDelete: 'set null' }),
        captainId: uuid('captain_id').references(() => players.id, { onDelete: 'set null' }),
        isDefault: boolean('is_default').notNull().default(false),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('tactical_presets_club_id_idx').on(table.clubId),
    ],
)

// Current tactics for a club (1 row per club, source of truth)
export const clubTactics = pgTable(
    'club_tactics',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        clubId: uuid('club_id')
            .notNull()
            .references(() => clubs.id, { onDelete: 'cascade' }),
        formation: varchar('formation', { length: 10 }).notNull().default('4-4-2'),
        mentality: mentalityEnum('mentality').notNull().default('balanced'),
        pressing: tacticLevelEnum('pressing').notNull().default('medium'),
        passingStyle: passingStyleEnum('passing_style').notNull().default('mixed'),
        width: widthEnum('width').notNull().default('normal'),
        tempo: tempoEnum('tempo').notNull().default('normal'),
        defensiveLine: tacticLevelEnum('defensive_line').notNull().default('medium'),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex('club_tactics_club_id_idx').on(table.clubId),
    ],
)

// Current composition for a club (1 row per club, source of truth)
export const clubCompositions = pgTable(
    'club_compositions',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        clubId: uuid('club_id')
            .notNull()
            .references(() => clubs.id, { onDelete: 'cascade' }),
        formation: varchar('formation', { length: 10 }).notNull(),
        startingXI: jsonb('starting_xi').notNull().$type<Array<{ playerId: string; position: string }>>(),
        bench: jsonb('bench').notNull().$type<Array<{ playerId: string; position: string }>>(),
        captainId: uuid('captain_id').references(() => players.id, { onDelete: 'set null' }),
        penaltyTakerId: uuid('penalty_taker_id').references(() => players.id, { onDelete: 'set null' }),
        freeKickTakerId: uuid('free_kick_taker_id').references(() => players.id, { onDelete: 'set null' }),
        cornerLeftTakerId: uuid('corner_left_taker_id').references(() => players.id, { onDelete: 'set null' }),
        cornerRightTakerId: uuid('corner_right_taker_id').references(() => players.id, { onDelete: 'set null' }),
        coherence: integer('coherence').notNull().default(0),
        warnings: jsonb('warnings').notNull().$type<string[]>().default([]),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex('club_compositions_club_id_idx').on(table.clubId),
    ],
)
