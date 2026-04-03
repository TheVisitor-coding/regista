import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    integer,
    pgEnum,
    boolean,
    real,
    text,
    index,
    uniqueIndex,
    bigint,
} from 'drizzle-orm/pg-core'
import { clubs } from './clubs.js'

export const playerPositionEnum = pgEnum('player_position', [
    'GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF',
])

export const players = pgTable(
    'players',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        clubId: uuid('club_id').references(() => clubs.id, { onDelete: 'set null' }),
        firstName: varchar('first_name', { length: 30 }).notNull(),
        lastName: varchar('last_name', { length: 30 }).notNull(),
        nationality: varchar('nationality', { length: 3 }).notNull(),
        age: integer('age').notNull(),
        position: playerPositionEnum('position').notNull(),
        secondaryPositions: text('secondary_positions').array().notNull().default([]),
        overall: integer('overall').notNull(),
        potential: integer('potential').notNull(),
        fatigue: integer('fatigue').notNull().default(0),
        isInjured: boolean('is_injured').notNull().default(false),
        injuryMatchesRemaining: integer('injury_matches_remaining').notNull().default(0),
        injuryType: varchar('injury_type', { length: 50 }),
        isSuspended: boolean('is_suspended').notNull().default(false),
        suspensionMatchesRemaining: integer('suspension_matches_remaining').notNull().default(0),
        yellowCardsSeason: integer('yellow_cards_season').notNull().default(0),
        contractMatchesRemaining: integer('contract_matches_remaining').notNull(),
        weeklySalary: bigint('weekly_salary', { mode: 'number' }).notNull(),
        releaseClause: bigint('release_clause', { mode: 'number' }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('players_club_id_idx').on(table.clubId),
        index('players_position_idx').on(table.position),
    ],
)

export const playerStats = pgTable(
    'player_stats',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        playerId: uuid('player_id')
            .notNull()
            .references(() => players.id, { onDelete: 'cascade' }),
        // Physique
        pace: real('pace').notNull(),
        stamina: real('stamina').notNull(),
        strength: real('strength').notNull(),
        agility: real('agility').notNull(),
        // Technique
        passing: real('passing').notNull(),
        shooting: real('shooting').notNull(),
        dribbling: real('dribbling').notNull(),
        crossing: real('crossing').notNull(),
        heading: real('heading').notNull(),
        // Mental
        vision: real('vision').notNull(),
        composure: real('composure').notNull(),
        workRate: real('work_rate').notNull(),
        positioning: real('positioning').notNull(),
        // Defense
        tackling: real('tackling').notNull(),
        marking: real('marking').notNull(),
        // Special
        penalties: real('penalties').notNull(),
        freeKick: real('free_kick').notNull(),
    },
    (table) => [
        uniqueIndex('player_stats_player_id_idx').on(table.playerId),
    ],
)

export const goalkeeperStats = pgTable(
    'goalkeeper_stats',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        playerId: uuid('player_id')
            .notNull()
            .references(() => players.id, { onDelete: 'cascade' }),
        reflexes: real('reflexes').notNull(),
        diving: real('diving').notNull(),
        handling: real('handling').notNull(),
        positioning: real('positioning').notNull(),
        kicking: real('kicking').notNull(),
        communication: real('communication').notNull(),
        penalties: real('penalties').notNull(),
        freeKick: real('free_kick').notNull(),
    },
    (table) => [
        uniqueIndex('goalkeeper_stats_player_id_idx').on(table.playerId),
    ],
)
