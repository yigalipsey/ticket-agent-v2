import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const countriesTable = pgTable('countries', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  name_en: text('name_en'),
  slug: text('slug').notNull().unique(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});
