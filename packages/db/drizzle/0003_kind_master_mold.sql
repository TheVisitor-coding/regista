CREATE TYPE "public"."ai_profile" AS ENUM('offensive', 'balanced', 'defensive');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('scheduled', 'live', 'finished', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."season_status" AS ENUM('created', 'in_progress', 'finishing', 'intersaison', 'archived');--> statement-breakpoint
CREATE TABLE "divisions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"league_id" uuid NOT NULL,
	"level" integer NOT NULL,
	"name" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leagues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"match_time" time DEFAULT '21:00' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid NOT NULL,
	"matchday" integer NOT NULL,
	"home_club_id" uuid NOT NULL,
	"away_club_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone NOT NULL,
	"status" "match_status" DEFAULT 'scheduled' NOT NULL,
	"home_score" integer,
	"away_score" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"match_reminders" boolean DEFAULT true NOT NULL,
	"match_results" boolean DEFAULT true NOT NULL,
	"standing_changes" boolean DEFAULT true NOT NULL,
	"squad_alerts" boolean DEFAULT true NOT NULL,
	"finance_alerts" boolean DEFAULT true NOT NULL,
	"transfer_alerts" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "season_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid NOT NULL,
	"club_id" uuid NOT NULL,
	"final_position" integer NOT NULL,
	"points" integer NOT NULL,
	"promoted" boolean DEFAULT false NOT NULL,
	"relegated" boolean DEFAULT false NOT NULL,
	"champion" boolean DEFAULT false NOT NULL,
	"prize_money" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"division_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"status" "season_status" DEFAULT 'created' NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"total_matchdays" integer DEFAULT 38 NOT NULL,
	"current_matchday" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "standings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_id" uuid NOT NULL,
	"club_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"played" integer DEFAULT 0 NOT NULL,
	"won" integer DEFAULT 0 NOT NULL,
	"drawn" integer DEFAULT 0 NOT NULL,
	"lost" integer DEFAULT 0 NOT NULL,
	"goals_for" integer DEFAULT 0 NOT NULL,
	"goals_against" integer DEFAULT 0 NOT NULL,
	"goal_difference" integer DEFAULT 0 NOT NULL,
	"points" integer DEFAULT 0 NOT NULL,
	"home_won" integer DEFAULT 0 NOT NULL,
	"home_drawn" integer DEFAULT 0 NOT NULL,
	"home_lost" integer DEFAULT 0 NOT NULL,
	"away_won" integer DEFAULT 0 NOT NULL,
	"away_drawn" integer DEFAULT 0 NOT NULL,
	"away_lost" integer DEFAULT 0 NOT NULL,
	"form" varchar(5) DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "division_id" uuid;--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "is_ai" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "ai_profile" "ai_profile";--> statement-breakpoint
ALTER TABLE "divisions" ADD CONSTRAINT "divisions_league_id_leagues_id_fk" FOREIGN KEY ("league_id") REFERENCES "public"."leagues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_club_id_clubs_id_fk" FOREIGN KEY ("home_club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_club_id_clubs_id_fk" FOREIGN KEY ("away_club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_results" ADD CONSTRAINT "season_results_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "season_results" ADD CONSTRAINT "season_results_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seasons" ADD CONSTRAINT "seasons_division_id_divisions_id_fk" FOREIGN KEY ("division_id") REFERENCES "public"."divisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standings" ADD CONSTRAINT "standings_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "standings" ADD CONSTRAINT "standings_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "divisions_league_id_idx" ON "divisions" USING btree ("league_id");--> statement-breakpoint
CREATE UNIQUE INDEX "divisions_league_id_level_idx" ON "divisions" USING btree ("league_id","level");--> statement-breakpoint
CREATE INDEX "matches_season_matchday_idx" ON "matches" USING btree ("season_id","matchday");--> statement-breakpoint
CREATE INDEX "matches_home_club_idx" ON "matches" USING btree ("home_club_id");--> statement-breakpoint
CREATE INDEX "matches_away_club_idx" ON "matches" USING btree ("away_club_id");--> statement-breakpoint
CREATE UNIQUE INDEX "matches_season_matchday_home_idx" ON "matches" USING btree ("season_id","matchday","home_club_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_preferences_user_id_idx" ON "notification_preferences" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "season_results_season_club_idx" ON "season_results" USING btree ("season_id","club_id");--> statement-breakpoint
CREATE INDEX "seasons_division_id_idx" ON "seasons" USING btree ("division_id");--> statement-breakpoint
CREATE UNIQUE INDEX "seasons_division_id_number_idx" ON "seasons" USING btree ("division_id","number");--> statement-breakpoint
CREATE UNIQUE INDEX "standings_season_club_idx" ON "standings" USING btree ("season_id","club_id");--> statement-breakpoint
CREATE INDEX "standings_season_id_idx" ON "standings" USING btree ("season_id");