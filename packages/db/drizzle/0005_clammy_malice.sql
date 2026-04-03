CREATE TYPE "public"."match_event_outcome" AS ENUM('success', 'failure', 'neutral');--> statement-breakpoint
CREATE TYPE "public"."match_event_type" AS ENUM('kick_off', 'goal', 'shot_on_target', 'shot_off_target', 'foul', 'yellow_card', 'red_card', 'injury', 'substitution', 'tactical_change', 'corner', 'penalty', 'save', 'half_time_start', 'half_time_end', 'full_time', 'possession_change');--> statement-breakpoint
CREATE TYPE "public"."match_zone" AS ENUM('defense', 'midfield', 'attack');--> statement-breakpoint
CREATE TYPE "public"."mentality" AS ENUM('ultra_defensive', 'defensive', 'balanced', 'offensive', 'ultra_offensive');--> statement-breakpoint
CREATE TYPE "public"."passing_style" AS ENUM('short', 'mixed', 'long');--> statement-breakpoint
CREATE TYPE "public"."tactic_level" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."tempo_setting" AS ENUM('slow', 'normal', 'fast');--> statement-breakpoint
CREATE TYPE "public"."width_setting" AS ENUM('narrow', 'normal', 'wide');--> statement-breakpoint
CREATE TABLE "match_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"minute" integer NOT NULL,
	"type" "match_event_type" NOT NULL,
	"club_id" uuid,
	"player_id" uuid,
	"secondary_player_id" uuid,
	"zone" "match_zone",
	"outcome" "match_event_outcome" DEFAULT 'neutral' NOT NULL,
	"metadata" jsonb DEFAULT 'null'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_lineups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"club_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"position" "player_position" NOT NULL,
	"is_starter" boolean NOT NULL,
	"minute_in" integer DEFAULT 0 NOT NULL,
	"minute_out" integer,
	"rating" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_player_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"player_id" uuid NOT NULL,
	"club_id" uuid NOT NULL,
	"minutes_played" integer DEFAULT 0 NOT NULL,
	"goals" integer DEFAULT 0 NOT NULL,
	"assists" integer DEFAULT 0 NOT NULL,
	"shots" integer DEFAULT 0 NOT NULL,
	"shots_on_target" integer DEFAULT 0 NOT NULL,
	"passes" integer DEFAULT 0 NOT NULL,
	"tackles" integer DEFAULT 0 NOT NULL,
	"fouls_committed" integer DEFAULT 0 NOT NULL,
	"yellow_cards" integer DEFAULT 0 NOT NULL,
	"red_card" boolean DEFAULT false NOT NULL,
	"rating" real DEFAULT 6 NOT NULL,
	"fatigue_start" integer DEFAULT 0 NOT NULL,
	"fatigue_end" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"club_id" uuid NOT NULL,
	"possession" real DEFAULT 50 NOT NULL,
	"shots" integer DEFAULT 0 NOT NULL,
	"shots_on_target" integer DEFAULT 0 NOT NULL,
	"passes" integer DEFAULT 0 NOT NULL,
	"pass_accuracy" real DEFAULT 0 NOT NULL,
	"fouls" integer DEFAULT 0 NOT NULL,
	"corners" integer DEFAULT 0 NOT NULL,
	"yellow_cards" integer DEFAULT 0 NOT NULL,
	"red_cards" integer DEFAULT 0 NOT NULL,
	"saves" integer DEFAULT 0 NOT NULL,
	"tackles" integer DEFAULT 0 NOT NULL,
	"interceptions" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_tactical_changes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"club_id" uuid NOT NULL,
	"minute" integer NOT NULL,
	"formation" varchar(10),
	"mentality" "mentality",
	"pressing" "tactic_level",
	"passing_style" "passing_style",
	"width" "width_setting",
	"tempo" "tempo_setting",
	"defensive_line" "tactic_level",
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "started_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "finished_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "added_time_first_half" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "added_time_second_half" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_secondary_player_id_players_id_fk" FOREIGN KEY ("secondary_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_lineups" ADD CONSTRAINT "match_lineups_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_lineups" ADD CONSTRAINT "match_lineups_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_lineups" ADD CONSTRAINT "match_lineups_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_player_stats" ADD CONSTRAINT "match_player_stats_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_stats" ADD CONSTRAINT "match_stats_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_stats" ADD CONSTRAINT "match_stats_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_tactical_changes" ADD CONSTRAINT "match_tactical_changes_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_tactical_changes" ADD CONSTRAINT "match_tactical_changes_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "match_events_match_minute_idx" ON "match_events" USING btree ("match_id","minute");--> statement-breakpoint
CREATE INDEX "match_lineups_match_club_idx" ON "match_lineups" USING btree ("match_id","club_id");--> statement-breakpoint
CREATE UNIQUE INDEX "match_lineups_match_player_idx" ON "match_lineups" USING btree ("match_id","player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "match_player_stats_match_player_idx" ON "match_player_stats" USING btree ("match_id","player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "match_stats_match_club_idx" ON "match_stats" USING btree ("match_id","club_id");--> statement-breakpoint
CREATE INDEX "match_tactical_changes_match_club_idx" ON "match_tactical_changes" USING btree ("match_id","club_id");