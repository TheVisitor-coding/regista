CREATE TYPE "public"."financial_transaction_type" AS ENUM('ticket_revenue', 'tv_rights', 'player_sale', 'salary', 'player_purchase', 'prize', 'other');--> statement-breakpoint
CREATE TYPE "public"."notification_category" AS ENUM('match', 'injury', 'finance', 'transfer', 'tactic', 'system');--> statement-breakpoint
CREATE TYPE "public"."notification_priority" AS ENUM('critical', 'important', 'warning', 'info', 'positive');--> statement-breakpoint
CREATE TYPE "public"."staff_role" AS ENUM('assistant', 'doctor', 'sporting_director', 'secretary');--> statement-breakpoint
CREATE TABLE "club_staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"role" "staff_role" NOT NULL,
	"first_name" varchar(30) NOT NULL,
	"last_name" varchar(30) NOT NULL,
	"avatar_id" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(30) NOT NULL,
	"primary_color" varchar(7) NOT NULL,
	"secondary_color" varchar(7) NOT NULL,
	"logo_id" varchar(50) NOT NULL,
	"stadium_name" varchar(50) NOT NULL,
	"balance" bigint NOT NULL,
	"morale" integer DEFAULT 60 NOT NULL,
	"league_id" uuid,
	"name_changes_remaining" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "financial_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"type" "financial_transaction_type" NOT NULL,
	"amount" bigint NOT NULL,
	"description" varchar(200) NOT NULL,
	"reference_id" uuid,
	"balance_after" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"staff_role" "staff_role" NOT NULL,
	"category" "notification_category" NOT NULL,
	"priority" "notification_priority" NOT NULL,
	"title" varchar(100) NOT NULL,
	"message" varchar(2000) NOT NULL,
	"action_url" varchar(200),
	"is_read" boolean DEFAULT false NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"metadata" jsonb DEFAULT 'null'::jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "club_staff" ADD CONSTRAINT "club_staff_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_transactions" ADD CONSTRAINT "financial_transactions_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "club_staff_club_id_role_idx" ON "club_staff" USING btree ("club_id","role");--> statement-breakpoint
CREATE UNIQUE INDEX "clubs_user_id_idx" ON "clubs" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "clubs_name_lower_idx" ON "clubs" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "clubs_league_id_idx" ON "clubs" USING btree ("league_id");--> statement-breakpoint
CREATE INDEX "financial_transactions_club_id_created_at_idx" ON "financial_transactions" USING btree ("club_id","created_at");--> statement-breakpoint
CREATE INDEX "financial_transactions_club_id_type_idx" ON "financial_transactions" USING btree ("club_id","type");--> statement-breakpoint
CREATE INDEX "notifications_club_id_created_at_idx" ON "notifications" USING btree ("club_id","created_at");--> statement-breakpoint
CREATE INDEX "notifications_club_id_is_read_idx" ON "notifications" USING btree ("club_id","is_read");