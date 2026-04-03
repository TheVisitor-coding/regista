CREATE TABLE "training_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"gk_focus" varchar(20) DEFAULT 'reflexes' NOT NULL,
	"def_focus" varchar(20) DEFAULT 'defensive' NOT NULL,
	"mid_focus" varchar(20) DEFAULT 'technical' NOT NULL,
	"att_focus" varchar(20) DEFAULT 'technical' NOT NULL,
	"individual_overrides" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "training_programs" ADD CONSTRAINT "training_programs_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "training_programs_club_id_idx" ON "training_programs" USING btree ("club_id");