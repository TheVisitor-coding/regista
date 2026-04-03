import {
    pgTable,
    uuid,
    varchar,
    timestamp,
    integer,
    pgEnum,
    boolean,
    time,
    index,
    uniqueIndex,
} from 'drizzle-orm/pg-core'
import { clubs } from './clubs.js'
import { users } from './users.js'

// Enums

export const seasonStatusEnum = pgEnum('season_status', [
    'created',
    'in_progress',
    'finishing',
    'intersaison',
    'archived',
])

export const matchStatusEnum = pgEnum('match_status', [
    'scheduled',
    'live',
    'finished',
    'cancelled',
])

// aiProfileEnum is defined in clubs.ts (to avoid circular imports)

// Tables

export const leagues = pgTable('leagues', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 50 }).notNull(),
    matchTime: time('match_time').notNull().default('21:00'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const divisions = pgTable(
    'divisions',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        leagueId: uuid('league_id')
            .notNull()
            .references(() => leagues.id, { onDelete: 'cascade' }),
        level: integer('level').notNull(),
        name: varchar('name', { length: 50 }).notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('divisions_league_id_idx').on(table.leagueId),
        uniqueIndex('divisions_league_id_level_idx').on(table.leagueId, table.level),
    ],
)

export const seasons = pgTable(
    'seasons',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        divisionId: uuid('division_id')
            .notNull()
            .references(() => divisions.id, { onDelete: 'cascade' }),
        number: integer('number').notNull(),
        status: seasonStatusEnum('status').notNull().default('created'),
        startedAt: timestamp('started_at', { withTimezone: true }),
        finishedAt: timestamp('finished_at', { withTimezone: true }),
        totalMatchdays: integer('total_matchdays').notNull().default(38),
        currentMatchday: integer('current_matchday').notNull().default(0),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('seasons_division_id_idx').on(table.divisionId),
        uniqueIndex('seasons_division_id_number_idx').on(table.divisionId, table.number),
    ],
)

export const standings = pgTable(
    'standings',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        seasonId: uuid('season_id')
            .notNull()
            .references(() => seasons.id, { onDelete: 'cascade' }),
        clubId: uuid('club_id')
            .notNull()
            .references(() => clubs.id, { onDelete: 'cascade' }),
        position: integer('position').notNull().default(0),
        played: integer('played').notNull().default(0),
        won: integer('won').notNull().default(0),
        drawn: integer('drawn').notNull().default(0),
        lost: integer('lost').notNull().default(0),
        goalsFor: integer('goals_for').notNull().default(0),
        goalsAgainst: integer('goals_against').notNull().default(0),
        goalDifference: integer('goal_difference').notNull().default(0),
        points: integer('points').notNull().default(0),
        homeWon: integer('home_won').notNull().default(0),
        homeDrawn: integer('home_drawn').notNull().default(0),
        homeLost: integer('home_lost').notNull().default(0),
        awayWon: integer('away_won').notNull().default(0),
        awayDrawn: integer('away_drawn').notNull().default(0),
        awayLost: integer('away_lost').notNull().default(0),
        form: varchar('form', { length: 5 }).notNull().default(''),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex('standings_season_club_idx').on(table.seasonId, table.clubId),
        index('standings_season_id_idx').on(table.seasonId),
    ],
)

export const matches = pgTable(
    'matches',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        seasonId: uuid('season_id')
            .notNull()
            .references(() => seasons.id, { onDelete: 'cascade' }),
        matchday: integer('matchday').notNull(),
        homeClubId: uuid('home_club_id')
            .notNull()
            .references(() => clubs.id, { onDelete: 'cascade' }),
        awayClubId: uuid('away_club_id')
            .notNull()
            .references(() => clubs.id, { onDelete: 'cascade' }),
        scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
        status: matchStatusEnum('status').notNull().default('scheduled'),
        homeScore: integer('home_score'),
        awayScore: integer('away_score'),
        startedAt: timestamp('started_at', { withTimezone: true }),
        finishedAt: timestamp('finished_at', { withTimezone: true }),
        addedTimeFirstHalf: integer('added_time_first_half').notNull().default(0),
        addedTimeSecondHalf: integer('added_time_second_half').notNull().default(0),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('matches_season_matchday_idx').on(table.seasonId, table.matchday),
        index('matches_home_club_idx').on(table.homeClubId),
        index('matches_away_club_idx').on(table.awayClubId),
        uniqueIndex('matches_season_matchday_home_idx').on(table.seasonId, table.matchday, table.homeClubId),
    ],
)

export const seasonResults = pgTable(
    'season_results',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        seasonId: uuid('season_id')
            .notNull()
            .references(() => seasons.id, { onDelete: 'cascade' }),
        clubId: uuid('club_id')
            .notNull()
            .references(() => clubs.id, { onDelete: 'cascade' }),
        finalPosition: integer('final_position').notNull(),
        points: integer('points').notNull(),
        promoted: boolean('promoted').notNull().default(false),
        relegated: boolean('relegated').notNull().default(false),
        champion: boolean('champion').notNull().default(false),
        prizeMoney: integer('prize_money').notNull().default(0),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex('season_results_season_club_idx').on(table.seasonId, table.clubId),
    ],
)

export const notificationPreferences = pgTable(
    'notification_preferences',
    {
        id: uuid('id').primaryKey().defaultRandom(),
        userId: uuid('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        matchReminders: boolean('match_reminders').notNull().default(true),
        matchResults: boolean('match_results').notNull().default(true),
        standingChanges: boolean('standing_changes').notNull().default(true),
        squadAlerts: boolean('squad_alerts').notNull().default(true),
        financeAlerts: boolean('finance_alerts').notNull().default(true),
        transferAlerts: boolean('transfer_alerts').notNull().default(true),
        updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        uniqueIndex('notification_preferences_user_id_idx').on(table.userId),
    ],
)
