import {
  boolean,
  char,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import type { SEOContent } from '../../common/types/seo.types';

export const teamsTable = pgTable(
  'teams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    name_en: text('name_en'),
    code: char('code', { length: 3 }).notNull(),
    slug: text('slug').notNull().unique(),
    logo_url: text('logo_url'),
    shirt_image_url: text('shirt_image_url'),
    image_url: text('image_url'),
    banner_url: text('banner_url'),
    primary_color: text('primary_color'),
    secondary_color: text('secondary_color'),
    api_football_id: integer('api_football_id').unique(),
    is_popular: boolean('is_popular').default(false),
    seo_content: jsonb('seo_content').$type<SEOContent>(),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('teams_name_idx').on(table.name),
    index('teams_name_en_idx').on(table.name_en),
    index('teams_is_popular_idx').on(table.is_popular),
  ],
);
