CREATE TABLE "club_compositions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"formation" varchar(10) NOT NULL,
	"starting_xi" jsonb NOT NULL,
	"bench" jsonb NOT NULL,
	"captain_id" uuid,
	"penalty_taker_id" uuid,
	"free_kick_taker_id" uuid,
	"corner_left_taker_id" uuid,
	"corner_right_taker_id" uuid,
	"coherence" integer DEFAULT 0 NOT NULL,
	"warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "club_tactics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"formation" varchar(10) DEFAULT '4-4-2' NOT NULL,
	"mentality" "mentality" DEFAULT 'balanced' NOT NULL,
	"pressing" "tactic_level" DEFAULT 'medium' NOT NULL,
	"passing_style" "passing_style" DEFAULT 'mixed' NOT NULL,
	"width" "width_setting" DEFAULT 'normal' NOT NULL,
	"tempo" "tempo_setting" DEFAULT 'normal' NOT NULL,
	"defensive_line" "tactic_level" DEFAULT 'medium' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "club_compositions" ADD CONSTRAINT "club_compositions_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_compositions" ADD CONSTRAINT "club_compositions_captain_id_players_id_fk" FOREIGN KEY ("captain_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_compositions" ADD CONSTRAINT "club_compositions_penalty_taker_id_players_id_fk" FOREIGN KEY ("penalty_taker_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_compositions" ADD CONSTRAINT "club_compositions_free_kick_taker_id_players_id_fk" FOREIGN KEY ("free_kick_taker_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_compositions" ADD CONSTRAINT "club_compositions_corner_left_taker_id_players_id_fk" FOREIGN KEY ("corner_left_taker_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_compositions" ADD CONSTRAINT "club_compositions_corner_right_taker_id_players_id_fk" FOREIGN KEY ("corner_right_taker_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_tactics" ADD CONSTRAINT "club_tactics_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "club_compositions_club_id_idx" ON "club_compositions" USING btree ("club_id");--> statement-breakpoint
CREATE UNIQUE INDEX "club_tactics_club_id_idx" ON "club_tactics" USING btree ("club_id");