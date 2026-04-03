import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    integer,
    pgEnum,
    boolean,
    real,
    jsonb,
    index,
    uniqueIndex,
} from 'drizzle-orm/pg-core'
import { matches } from './competition.js'
import { clubs } from './clubs.js'
import { players } from './players.js'
import { playerPositionEnum } from './players.js'

// Enums

export const matchEventTypeEnum = pgEnum('match_event_type', [
    'kick_off',
    'goal',
    'shot_on_target',
    'shot_off_target',
    'foul',
    'yellow_card',
    'red_card',
    'injury',
    'substitution',
    'tactical_change',
    'corner',
    'penalty',
    'save',
    'half_time_start',
    'half_time_end',
    'full_time',
    'possession_change',
])

export const matchEventOutcomeEnum = pgEnum('match_event_outcome', [
    'success',
    'failure',
    'neutral',
])

export const matchZoneEnum = pgEnum('match_zone', [
    'defense',
    'midfield',
    'attack',
])

export const mentalityEnum = pgEnum('mentality', [
    'ultra_defensive',
    'defensive',
    'balanced',
    'offensive',
    'ultra_offensive',
])

export const tacticLevelEnum = pgEnum('tactic_level', [
    'low',
    'medium',
    'high',
])

export const passingStyleEnum = pgEnum('passing_style', [
    'short',
    'mixed',
    'long',
])

export const widthEnum = pgEnum('width_setting', [
    'narrow',
    'normal',
    'wide',
])

export const tempoEnum = pgEnum('tempo_setting', [
    'slow',
    'normal',
    'fast',
])

// Tables

export const matchEvents = pgTable(
    'match_events',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        matchId: uuid('match_id')
            .notNull()
            .references(() => matches.id, { onDelete: 'cascade' }),
        minute: integer('minute').notNull(),
        type: matchEventTypeEnum('type').notNull(),
        clubId: uuid('club_id').references(() => clubs.id),
        playerId: uuid('player_id').references(() => players.id),
        secondaryPlayerId: uuid('secondary_player_id').references(() => players.id),
        zone: matchZoneEnum('zone'),
        outcome: matchEventOutcomeEnum('outcome').notNull().default('neutral'),
        metadata: jsonb('metadata').$type<Record<string, unknown> | null>().default(null),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('match_events_match_minute_idx').on(table.matchId, table.minute),
    ],
)

export const matchLineups = pgTable(
    'match_lineups',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        matchId: uuid('match_id')
            .notNull()
            .references(() => matches.id, { onDelete: 'cascade' }),
        clubId: uuid('club_id')
            .notNull()
            .references(() => clubs.id, { onDelete: 'cascade' }),
        playerId: uuid('player_id')
            .notNull()
            .references(() => players.id, { onDelete: 'cascade' }),
        position: playerPositionEnum('position').notNull(),
        isStarter: boolean('is_starter').notNull(),
        minuteIn: integer('minute_in').notNull().default(0),
        minuteOut: integer('minute_out'),
        rating: real('rating'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('match_lineups_match_club_idx').on(table.matchId, table.clubId),
        uniqueIndex('match_lineups_match_player_idx').on(table.matchId, table.playerId),
    ],
)

export const matchStats = pgTable(
    'match_stats',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        matchId: uuid('match_id')
            .notNull()
            .references(() => matches.id, { onDelete: 'cascade' }),
        clubId: uuid('club_id')
            .notNull()
            .references(() => clubs.id, { onDelete: 'cascade' }),
        possession: real('possession').notNull().default(50),
        shots: integer('shots').notNull().default(0),
        shotsOnTarget: integer('shots_on_target').notNull().default(0),
        passes: integer('passes').notNull().default(0),
        passAccuracy: real('pass_accuracy').notNull().default(0),
        fouls: integer('fouls').notNull().default(0),
        corners: integer('corners').notNull().default(0),
        yellowCards: integer('yellow_cards').notNull().default(0),
        redCards: integer('red_cards').notNull().default(0),
        saves: integer('saves').notNull().default(0),
        tackles: integer('tackles').notNull().default(0),
        interceptions: integer('interceptions').notNull().default(0),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex('match_stats_match_club_idx').on(table.matchId, table.clubId),
    ],
)

export const matchPlayerStats = pgTable(
    'match_player_stats',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        matchId: uuid('match_id')
            .notNull()
            .references(() => matches.id, { onDelete: 'cascade' }),
        playerId: uuid('player_id')
            .notNull()
            .references(() => players.id, { onDelete: 'cascade' }),
        clubId: uuid('club_id')
            .notNull()
            .references(() => clubs.id, { onDelete: 'cascade' }),
        minutesPlayed: integer('minutes_played').notNull().default(0),
        goals: integer('goals').notNull().default(0),
        assists: integer('assists').notNull().default(0),
        shots: integer('shots').notNull().default(0),
        shotsOnTarget: integer('shots_on_target').notNull().default(0),
        passes: integer('passes').notNull().default(0),
        tackles: integer('tackles').notNull().default(0),
        foulsCommitted: integer('fouls_committed').notNull().default(0),
        yellowCards: integer('yellow_cards').notNull().default(0),
        redCard: boolean('red_card').notNull().default(false),
        rating: real('rating').notNull().default(6.0),
        fatigueStart: integer('fatigue_start').notNull().default(0),
        fatigueEnd: integer('fatigue_end').notNull().default(0),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex('match_player_stats_match_player_idx').on(table.matchId, table.playerId),
    ],
)

export const matchTacticalChanges = pgTable(
    'match_tactical_changes',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        matchId: uuid('match_id')
            .notNull()
            .references(() => matches.id, { onDelete: 'cascade' }),
        clubId: uuid('club_id')
            .notNull()
            .references(() => clubs.id, { onDelete: 'cascade' }),
        minute: integer('minute').notNull(),
        formation: varchar('formation', { length: 10 }),
        mentality: mentalityEnum('mentality'),
        pressing: tacticLevelEnum('pressing'),
        passingStyle: passingStyleEnum('passing_style'),
        width: widthEnum('width'),
        tempo: tempoEnum('tempo'),
        defensiveLine: tacticLevelEnum('defensive_line'),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('match_tactical_changes_match_club_idx').on(table.matchId, table.clubId),
    ],
)
