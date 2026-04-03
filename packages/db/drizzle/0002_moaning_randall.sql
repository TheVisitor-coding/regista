CREATE TYPE "public"."player_position" AS ENUM('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF');--> statement-breakpoint
CREATE TABLE "goalkeeper_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"reflexes" real NOT NULL,
	"diving" real NOT NULL,
	"handling" real NOT NULL,
	"positioning" real NOT NULL,
	"kicking" real NOT NULL,
	"communication" real NOT NULL,
	"penalties" real NOT NULL,
	"free_kick" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_stats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"pace" real NOT NULL,
	"stamina" real NOT NULL,
	"strength" real NOT NULL,
	"agility" real NOT NULL,
	"passing" real NOT NULL,
	"shooting" real NOT NULL,
	"dribbling" real NOT NULL,
	"crossing" real NOT NULL,
	"heading" real NOT NULL,
	"vision" real NOT NULL,
	"composure" real NOT NULL,
	"work_rate" real NOT NULL,
	"positioning" real NOT NULL,
	"tackling" real NOT NULL,
	"marking" real NOT NULL,
	"penalties" real NOT NULL,
	"free_kick" real NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid,
	"first_name" varchar(30) NOT NULL,
	"last_name" varchar(30) NOT NULL,
	"nationality" varchar(3) NOT NULL,
	"age" integer NOT NULL,
	"position" "player_position" NOT NULL,
	"secondary_positions" text[] DEFAULT '{}' NOT NULL,
	"overall" integer NOT NULL,
	"potential" integer NOT NULL,
	"fatigue" integer DEFAULT 0 NOT NULL,
	"is_injured" boolean DEFAULT false NOT NULL,
	"injury_matches_remaining" integer DEFAULT 0 NOT NULL,
	"injury_type" varchar(50),
	"is_suspended" boolean DEFAULT false NOT NULL,
	"suspension_matches_remaining" integer DEFAULT 0 NOT NULL,
	"yellow_cards_season" integer DEFAULT 0 NOT NULL,
	"contract_matches_remaining" integer NOT NULL,
	"weekly_salary" bigint NOT NULL,
	"release_clause" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "goalkeeper_stats" ADD CONSTRAINT "goalkeeper_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_stats" ADD CONSTRAINT "player_stats_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "players" ADD CONSTRAINT "players_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "goalkeeper_stats_player_id_idx" ON "goalkeeper_stats" USING btree ("player_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_stats_player_id_idx" ON "player_stats" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "players_club_id_idx" ON "players" USING btree ("club_id");--> statement-breakpoint
CREATE INDEX "players_position_idx" ON "players" USING btree ("position");