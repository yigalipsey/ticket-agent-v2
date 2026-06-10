import type { footballEventsTable } from './football-events.schema';
import { eventStatusEnum, minPriceCurrencyEnum } from './football-events.schema';

export type FootballEvent = typeof footballEventsTable.$inferSelect;
export type NewFootballEvent = typeof footballEventsTable.$inferInsert;

/**
 * Derived from the pgEnum so both layers share a single source of truth.
 * The `satisfies` clause is a compile-time check: if a value is added to the
 * pgEnum but not here (or vice versa), TypeScript will error immediately.
 */
export const EventStatus = {
  SCHEDULED: 'scheduled',
  POSTPONED: 'postponed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const satisfies Record<string, (typeof eventStatusEnum.enumValues)[number]>;

export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

export const MinPriceCurrency = {
  EUR: 'EUR',
  USD: 'USD',
  ILS: 'ILS',
  GBP: 'GBP',
} as const satisfies Record<string, (typeof minPriceCurrencyEnum.enumValues)[number]>;

export type MinPriceCurrency = (typeof MinPriceCurrency)[keyof typeof MinPriceCurrency];
