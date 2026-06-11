CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_en" text NOT NULL,
	"slug" text NOT NULL,
	"origin" text DEFAULT 'international' NOT NULL,
	"description" text,
	"image_url" text,
	"website_url" text,
	"affiliate_link_base" text,
	"internal_code" text NOT NULL,
	"external_rating" jsonb,
	"contact_info" jsonb,
	"sync_config" jsonb,
	"is_active" boolean DEFAULT true NOT NULL,
	"deactivated_at" timestamp with time zone,
	"last_successful_sync_at" timestamp with time zone,
	"priority" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "suppliers_name_unique" UNIQUE("name"),
	CONSTRAINT "suppliers_slug_unique" UNIQUE("slug"),
	CONSTRAINT "suppliers_internal_code_unique" UNIQUE("internal_code")
);
--> statement-breakpoint
CREATE TABLE "team_supplier_mappings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"supplier_team_name" text,
	"supplier_external_id" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_team_supplier_mapping_supplier_team" UNIQUE("supplier_id","team_id"),
	CONSTRAINT "uq_team_supplier_mapping_supplier_external" UNIQUE("supplier_id","supplier_external_id")
);
--> statement-breakpoint
ALTER TABLE "team_supplier_mappings" ADD CONSTRAINT "team_supplier_mappings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_supplier_mappings" ADD CONSTRAINT "team_supplier_mappings_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;