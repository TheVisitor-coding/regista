CREATE TYPE "public"."counter_offer_status" AS ENUM('pending', 'accepted', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."free_agent_reason" AS ENUM('released', 'contract_expired', 'club_deleted');--> statement-breakpoint
CREATE TYPE "public"."transfer_listing_source" AS ENUM('ai_market', 'human_listing');--> statement-breakpoint
CREATE TYPE "public"."transfer_listing_status" AS ENUM('active', 'sold', 'expired', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."transfer_offer_status" AS ENUM('pending', 'accepted', 'rejected', 'counter_offered', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transfer_type" AS ENUM('market_purchase', 'human_transfer', 'release_clause', 'free_agent', 'released', 'contract_expired', 'club_deleted');--> statement-breakpoint
CREATE TABLE "free_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"previous_club_id" uuid,
	"reason" "free_agent_reason" NOT NULL,
	"penalty_applied" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfer_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"from_club_id" uuid,
	"to_club_id" uuid,
	"type" "transfer_type" NOT NULL,
	"fee" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfer_listings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"seller_club_id" uuid,
	"source" "transfer_listing_source" NOT NULL,
	"price" bigint NOT NULL,
	"status" "transfer_listing_status" DEFAULT 'active' NOT NULL,
	"listed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"sold_at" timestamp with time zone,
	"buyer_club_id" uuid,
	"expires_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfer_offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"player_id" uuid NOT NULL,
	"from_club_id" uuid NOT NULL,
	"to_club_id" uuid NOT NULL,
	"amount" bigint NOT NULL,
	"status" "transfer_offer_status" DEFAULT 'pending' NOT NULL,
	"parent_offer_id" uuid,
	"counter_amount" bigint,
	"counter_status" "counter_offer_status",
	"responded_at" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "free_agents" ADD CONSTRAINT "free_agents_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "free_agents" ADD CONSTRAINT "free_agents_previous_club_id_clubs_id_fk" FOREIGN KEY ("previous_club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_history" ADD CONSTRAINT "transfer_history_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_history" ADD CONSTRAINT "transfer_history_from_club_id_clubs_id_fk" FOREIGN KEY ("from_club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_history" ADD CONSTRAINT "transfer_history_to_club_id_clubs_id_fk" FOREIGN KEY ("to_club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_listings" ADD CONSTRAINT "transfer_listings_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_listings" ADD CONSTRAINT "transfer_listings_seller_club_id_clubs_id_fk" FOREIGN KEY ("seller_club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_listings" ADD CONSTRAINT "transfer_listings_buyer_club_id_clubs_id_fk" FOREIGN KEY ("buyer_club_id") REFERENCES "public"."clubs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_offers" ADD CONSTRAINT "transfer_offers_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_offers" ADD CONSTRAINT "transfer_offers_from_club_id_clubs_id_fk" FOREIGN KEY ("from_club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_offers" ADD CONSTRAINT "transfer_offers_to_club_id_clubs_id_fk" FOREIGN KEY ("to_club_id") REFERENCES "public"."clubs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "free_agents_player_idx" ON "free_agents" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "free_agents_expires_idx" ON "free_agents" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "transfer_history_player_idx" ON "transfer_history" USING btree ("player_id");--> statement-breakpoint
CREATE INDEX "transfer_history_from_idx" ON "transfer_history" USING btree ("from_club_id");--> statement-breakpoint
CREATE INDEX "transfer_history_to_idx" ON "transfer_history" USING btree ("to_club_id");--> statement-breakpoint
CREATE INDEX "transfer_listings_status_idx" ON "transfer_listings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "transfer_listings_source_status_idx" ON "transfer_listings" USING btree ("source","status");--> statement-breakpoint
CREATE INDEX "transfer_listings_seller_idx" ON "transfer_listings" USING btree ("seller_club_id");--> statement-breakpoint
CREATE INDEX "transfer_listings_expires_idx" ON "transfer_listings" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "transfer_offers_from_status_idx" ON "transfer_offers" USING btree ("from_club_id","status");--> statement-breakpoint
CREATE INDEX "transfer_offers_to_status_idx" ON "transfer_offers" USING btree ("to_club_id","status");--> statement-breakpoint
CREATE INDEX "transfer_offers_player_status_idx" ON "transfer_offers" USING btree ("player_id","status");--> statement-breakpoint
CREATE INDEX "transfer_offers_expires_idx" ON "transfer_offers" USING btree ("expires_at");