CREATE TABLE "tactical_presets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"name" varchar(20) NOT NULL,
	"formation" varchar(10) NOT NULL,
	"mentality" "mentality" DEFAULT 'balanced' NOT NULL,
	"pressing" "tactic_level" DEFAULT 'medium' NOT NULL,
	"passing_style" "passing_style" DEFAULT 'mixed' NOT NULL,
	"width" "width_setting" DEFAULT 'normal' NOT NULL,
	"tempo" "tempo_setting" DEFAULT 'normal' NOT NULL,
	"defensive_line" "tactic_level" DEFAULT 'medium' NOT NULL,
	"penalty_taker_id" uuid,
	"free_kick_taker_id" uuid,
	"corner_left_taker_id" uuid,
	"corner_right_taker_id" uuid,
	"captain_id" uuid,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clubs" ADD COLUMN "auto_adjustment" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tactical_presets" ADD CONSTRAINT "tactical_presets_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tactical_presets" ADD CONSTRAINT "tactical_presets_penalty_taker_id_players_id_fk" FOREIGN KEY ("penalty_taker_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tactical_presets" ADD CONSTRAINT "tactical_presets_free_kick_taker_id_players_id_fk" FOREIGN KEY ("free_kick_taker_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tactical_presets" ADD CONSTRAINT "tactical_presets_corner_left_taker_id_players_id_fk" FOREIGN KEY ("corner_left_taker_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tactical_presets" ADD CONSTRAINT "tactical_presets_corner_right_taker_id_players_id_fk" FOREIGN KEY ("corner_right_taker_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tactical_presets" ADD CONSTRAINT "tactical_presets_captain_id_players_id_fk" FOREIGN KEY ("captain_id") REFERENCES "public"."players"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tactical_presets_club_id_idx" ON "tactical_presets" USING btree ("club_id");