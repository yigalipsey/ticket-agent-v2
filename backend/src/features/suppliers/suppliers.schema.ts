import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
} from 'drizzle-orm/pg-core';

export const SUPPLIER_ORIGINS = ['israeli', 'international'] as const;
export type SupplierOrigin = (typeof SUPPLIER_ORIGINS)[number];

export const suppliersTable = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(), // Hebrew name
  name_en: text('name_en').notNull(), // English name
  slug: text('slug').notNull().unique(),
  origin: text('origin')
    .$type<SupplierOrigin>()
    .notNull()
    .default('international'),
  description: text('description'),
  image_url: text('image_url'),
  website_url: text('website_url'),
  affiliate_link_base: text('affiliate_link_base'),
  internal_code: text('internal_code').notNull().unique(),
  external_rating: jsonb('external_rating'),
  contact_info: jsonb('contact_info'),
  sync_config: jsonb('sync_config'),
  is_active: boolean('is_active').notNull().default(true),
  deactivated_at: timestamp('deactivated_at', { withTimezone: true }),
  last_successful_sync_at: timestamp('last_successful_sync_at', {
    withTimezone: true,
  }),
  priority: integer('priority').notNull().default(0),
  metadata: jsonb('metadata'),
  created_at: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
