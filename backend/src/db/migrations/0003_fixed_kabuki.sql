CREATE TYPE "public"."team_competition_status" AS ENUM('active', 'eliminated', 'relegated', 'withdrawn');--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"name_en" text,
	"description" text,
	"address" text,
	"address_en" text,
	"capacity" integer,
	"latitude" numeric(9, 6),
	"longitude" numeric(9, 6),
	"image_url" text,
	"banner_url" text,
	"map_url" text,
	"seo_content" jsonb,
	"faqs" jsonb,
	"api_football_id" integer,
	"is_popular" boolean DEFAULT false NOT NULL,
	"city_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "venues_slug_unique" UNIQUE("slug"),
	CONSTRAINT "venues_api_football_id_unique" UNIQUE("api_football_id")
);
--> statement-breakpoint
CREATE TABLE "team_competitions" (
	"team_id" uuid NOT NULL,
	"competition_id" uuid NOT NULL,
	"season" text NOT NULL,
	"status" "team_competition_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "team_competitions_team_id_competition_id_season_pk" PRIMARY KEY("team_id","competition_id","season")
);
--> statement-breakpoint
ALTER TABLE "competitions" RENAME COLUMN "background_image" TO "banner_url";--> statement-breakpoint
ALTER TABLE "teams" RENAME COLUMN "background_image" TO "banner_url";--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_competitions" ADD CONSTRAINT "team_competitions_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_competitions" ADD CONSTRAINT "team_competitions_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "venues_city_id_idx" ON "venues" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "venues_is_popular_idx" ON "venues" USING btree ("is_popular");--> statement-breakpoint
CREATE INDEX "team_competitions_competition_id_idx" ON "team_competitions" USING btree ("competition_id");--> statement-breakpoint
CREATE INDEX "team_competitions_competition_id_season_idx" ON "team_competitions" USING btree ("competition_id","season");--> statement-breakpoint
CREATE INDEX "team_competitions_team_id_season_idx" ON "team_competitions" USING btree ("team_id","season");