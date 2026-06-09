import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { countriesTable } from '../countries/countries.schema';
import type { FaqItem, SEOContent } from '../../common/types/seo.types';

export const citiesTable = pgTable(
  'cities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    name_en: text('name_en'),
    country_id: integer('country_id')
      .notNull()
      .references(() => countriesTable.id, { onDelete: 'cascade' }),
    is_popular: boolean('is_popular').default(false),
    image_url: text('image_url'),
    seo_content: jsonb('seo_content').$type<SEOContent>(),
    faqs: jsonb('faqs').$type<FaqItem[]>(),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('cities_country_id_idx').on(table.country_id),
    index('cities_is_popular_idx').on(table.is_popular),
  ],
);
