import type { venuesTable } from './venues.schema';

export type Venue = typeof venuesTable.$inferSelect;
export type NewVenue = typeof venuesTable.$inferInsert;
