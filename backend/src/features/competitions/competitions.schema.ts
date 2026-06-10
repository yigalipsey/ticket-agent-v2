import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { countriesTable } from '../countries/countries.schema';
import type { FaqItem, SEOContent } from '../../common/types/seo.types';

export const competitionTypeEnum = pgEnum('competition_type', ['League', 'Cup']);

export const competitionsTable = pgTable(
  'competitions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    name_en: text('name_en'),
    slug: text('slug').notNull().unique(),
    country_id: integer('country_id')
      .notNull()
      .references(() => countriesTable.id, { onDelete: 'cascade' }),
    parent_competition_id: uuid('parent_competition_id').references(
      (): AnyPgColumn => competitionsTable.id,
      { onDelete: 'set null' },
    ),
    logo_url: text('logo_url'),
    image_url: text('image_url'),
    banner_url: text('banner_url'),
    description: text('description'),
    type: competitionTypeEnum('type').notNull().default('League'),
    is_popular: boolean('is_popular').default(false),
    seo_content: jsonb('seo_content').$type<SEOContent>(),
    faqs: jsonb('faqs').$type<FaqItem[]>(),
    api_competition_id: integer('api_competition_id').unique(),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('competitions_country_id_idx').on(table.country_id),
    index('competitions_parent_competition_id_idx').on(
      table.parent_competition_id,
    ),
    index('competitions_is_popular_idx').on(table.is_popular),
  ],
);
