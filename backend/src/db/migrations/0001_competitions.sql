CREATE TYPE "public"."competition_type" AS ENUM('League', 'Cup');--> statement-breakpoint
CREATE TABLE "competitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_en" text,
	"slug" text NOT NULL,
	"country_id" integer NOT NULL,
	"parent_competition_id" uuid,
	"logo_url" text,
	"image_url" text,
	"background_image" text,
	"description" text,
	"type" "competition_type" DEFAULT 'League' NOT NULL,
	"is_popular" boolean DEFAULT false,
	"seo_content" jsonb,
	"faqs" jsonb,
	"api_competition_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "competitions_slug_unique" UNIQUE("slug"),
	CONSTRAINT "competitions_api_competition_id_unique" UNIQUE("api_competition_id")
);
--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_parent_competition_id_competitions_id_fk" FOREIGN KEY ("parent_competition_id") REFERENCES "public"."competitions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "competitions_country_id_idx" ON "competitions" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "competitions_parent_competition_id_idx" ON "competitions" USING btree ("parent_competition_id");--> statement-breakpoint
CREATE INDEX "competitions_is_popular_idx" ON "competitions" USING btree ("is_popular");