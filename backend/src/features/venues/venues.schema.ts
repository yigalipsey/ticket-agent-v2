import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { citiesTable } from '../cities/cities.schema';
import type { FaqItem, SEOContent } from '../../common/types/seo.types';

export const venuesTable = pgTable(
  'venues',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    name_en: text('name_en'),
    description: text('description'),
    address: text('address'),
    address_en: text('address_en'),
    capacity: integer('capacity'),
    latitude: decimal('latitude', { precision: 9, scale: 6 }),
    longitude: decimal('longitude', { precision: 9, scale: 6 }),
    image_url: text('image_url'),
    banner_url: text('banner_url'),
    map_url: text('map_url'),
    seo_content: jsonb('seo_content').$type<SEOContent>(),
    faqs: jsonb('faqs').$type<FaqItem[]>(),
    api_football_id: integer('api_football_id').unique(),
    is_popular: boolean('is_popular').notNull().default(false),
    city_id: uuid('city_id')
      .notNull()
      .references(() => citiesTable.id, { onDelete: 'cascade' }),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('venues_city_id_idx').on(table.city_id),
    index('venues_is_popular_idx').on(table.is_popular),
  ],
);

