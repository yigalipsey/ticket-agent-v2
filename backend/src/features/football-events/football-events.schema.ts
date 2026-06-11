import {
  boolean,
  decimal,
  index,
  integer,
  bigint,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { competitionsTable } from '../competitions/competitions.schema';
import { teamsTable } from '../teams/teams.schema';
import { venuesTable } from '../venues/venues.schema';

export const eventStatusEnum = pgEnum('event_status', [
  'scheduled',
  'postponed',
  'cancelled',
  'completed',
]);

export const minPriceCurrencyEnum = pgEnum('min_price_currency', [
  'EUR',
  'USD',
  'ILS',
  'GBP',
]);

export const footballEventsTable = pgTable(
  'football_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    event_number: bigint('event_number', { mode: 'number' })
      .unique()
      .notNull()
      .default(sql`nextval('football_events_event_number_seq')`),
    starts_at: timestamp('starts_at', { withTimezone: true }).notNull(),
    status: eventStatusEnum('status').notNull().default('scheduled'),
    competition_id: uuid('competition_id')
      .notNull()
      .references(() => competitionsTable.id, { onDelete: 'restrict' }),
    home_team_id: uuid('home_team_id').references(() => teamsTable.id, {
      onDelete: 'restrict',
    }),
    away_team_id: uuid('away_team_id').references(() => teamsTable.id, {
      onDelete: 'restrict',
    }),
    venue_id: uuid('venue_id')
      .notNull()
      .references(() => venuesTable.id, { onDelete: 'restrict' }),
    home_team_name: text('home_team_name'),
    away_team_name: text('away_team_name'),
    has_tbd_team: boolean('has_tbd_team').notNull().default(false),
    round: text('round'),
    round_number: integer('round_number'),
    slug: text('slug').notNull().unique(),
    tags: text('tags').array(),
    is_hot: boolean('is_hot').notNull().default(false),
    api_football_external_id: integer('api_football_external_id').unique(),
    football_data_external_id: integer('football_data_external_id').unique(),
    min_price_amount: decimal('min_price_amount', { precision: 10, scale: 2 }),
    min_price_currency: minPriceCurrencyEnum('min_price_currency'),
    min_price_sorting_ils: decimal('min_price_sorting_ils', {
      precision: 10,
      scale: 2,
    }),
    min_price_updated_at: timestamp('min_price_updated_at', {
      withTimezone: true,
    }),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index('football_events_competition_id_starts_at_idx').on(
      table.competition_id,
      table.starts_at,
    ),
    index('football_events_venue_id_starts_at_idx').on(
      table.venue_id,
      table.starts_at,
    ),
    index('football_events_is_hot_starts_at_idx').on(
      table.is_hot,
      table.starts_at,
    ),
    index('football_events_min_price_sorting_ils_idx').on(
      table.min_price_sorting_ils,
    ),
  ],
);
