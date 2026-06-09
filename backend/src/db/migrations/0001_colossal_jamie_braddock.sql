CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_en" text,
	"code" char(3) NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	"shirt_image_url" text,
	"image_url" text,
	"background_image" text,
	"primary_color" text,
	"secondary_color" text,
	"api_football_id" integer,
	"is_popular" boolean DEFAULT false,
	"seo_content" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "teams_slug_unique" UNIQUE("slug"),
	CONSTRAINT "teams_api_football_id_unique" UNIQUE("api_football_id")
);
--> statement-breakpoint
CREATE INDEX "teams_name_idx" ON "teams" USING btree ("name");--> statement-breakpoint
CREATE INDEX "teams_name_en_idx" ON "teams" USING btree ("name_en");--> statement-breakpoint
CREATE INDEX "teams_is_popular_idx" ON "teams" USING btree ("is_popular");