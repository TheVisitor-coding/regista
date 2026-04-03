CREATE TABLE "onboarding_missions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"mission_key" varchar(50) NOT NULL,
	"completed_at" timestamp with time zone,
	"reward_claimed" boolean DEFAULT false NOT NULL,
	"reward_amount" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "onboarding_missions" ADD CONSTRAINT "onboarding_missions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "onboarding_missions_user_key_idx" ON "onboarding_missions" USING btree ("user_id","mission_key");