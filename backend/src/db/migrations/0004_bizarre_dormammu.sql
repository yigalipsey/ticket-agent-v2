CREATE SEQUENCE IF NOT EXISTS football_events_event_number_seq START WITH 20000;--> statement-breakpoint
CREATE TYPE "public"."event_status" AS ENUM('scheduled', 'postponed', 'cancelled', 'completed');--> statement-breakpoint
CREATE TYPE "public"."min_price_currency" AS ENUM('EUR', 'USD', 'ILS', 'GBP');--> statement-breakpoint
CREATE TABLE "football_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_number" bigint DEFAULT nextval('football_events_event_number_seq') NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"status" "event_status" DEFAULT 'scheduled' NOT NULL,
	"competition_id" uuid NOT NULL,
	"home_team_id" uuid,
	"away_team_id" uuid,
	"venue_id" uuid NOT NULL,
	"home_team_name" text,
	"away_team_name" text,
	"has_tbd_team" boolean DEFAULT false NOT NULL,
	"round" text,
	"round_number" integer,
	"slug" text NOT NULL,
	"tags" text[],
	"is_hot" boolean DEFAULT false NOT NULL,
	"api_football_external_id" integer,
	"football_data_external_id" integer,
	"min_price_amount" numeric(10, 2),
	"min_price_currency" "min_price_currency",
	"min_price_sorting_ils" numeric(10, 2),
	"min_price_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "football_events_event_number_unique" UNIQUE("event_number"),
	CONSTRAINT "football_events_slug_unique" UNIQUE("slug"),
	CONSTRAINT "football_events_api_football_external_id_unique" UNIQUE("api_football_external_id"),
	CONSTRAINT "football_events_football_data_external_id_unique" UNIQUE("football_data_external_id")
);
--> statement-breakpoint
ALTER TABLE "football_events" ADD CONSTRAINT "football_events_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_events" ADD CONSTRAINT "football_events_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_events" ADD CONSTRAINT "football_events_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_events" ADD CONSTRAINT "football_events_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "football_events" ADD CONSTRAINT "home_team_xor_check" CHECK (
  (home_team_id IS NULL AND home_team_name IS NOT NULL) OR 
  (home_team_id IS NOT NULL AND home_team_name IS NULL)
);--> statement-breakpoint
ALTER TABLE "football_events" ADD CONSTRAINT "away_team_xor_check" CHECK (
  (away_team_id IS NULL AND away_team_name IS NOT NULL) OR 
  (away_team_id IS NOT NULL AND away_team_name IS NULL)
);--> statement-breakpoint
CREATE INDEX "football_events_competition_id_starts_at_idx" ON "football_events" USING btree ("competition_id","starts_at");--> statement-breakpoint
CREATE INDEX "football_events_venue_id_starts_at_idx" ON "football_events" USING btree ("venue_id","starts_at");--> statement-breakpoint
CREATE INDEX "football_events_is_hot_starts_at_idx" ON "football_events" USING btree ("is_hot","starts_at");--> statement-breakpoint
CREATE INDEX "football_events_min_price_sorting_ils_idx" ON "football_events" USING btree ("min_price_sorting_ils");