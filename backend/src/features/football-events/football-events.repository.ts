import { Inject, Injectable } from '@nestjs/common';
import { eq, and, ne, asc } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../db/drizzle.provider';
import type * as schema from '../../db/schema';
import { footballEventsTable } from './football-events.schema';
import type { FootballEvent, NewFootballEvent, EventStatus } from './football-events.types';
import { handleDbError } from '../../db/error-handler';

type DrizzleDb = PostgresJsDatabase<typeof schema>;

export type FindAllOptions = {
  competitionId?: string;
  venueId?: string;
  status?: EventStatus;
  isHot?: boolean;
  slug?: string;
  /** Defaults to 20. Max 100. */
  limit?: number;
  /** Defaults to 0. */
  offset?: number;
};

@Injectable()
export class FootballEventsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async checkSlugExists(slug: string, excludeId?: string): Promise<boolean> {
    const conditions = [eq(footballEventsTable.slug, slug)];
    if (excludeId) {
      conditions.push(ne(footballEventsTable.id, excludeId));
    }
    const rows = await this.db
      .select({ id: footballEventsTable.id })
      .from(footballEventsTable)
      .where(and(...conditions))
      .limit(1);
    return rows.length > 0;
  }

  async findAll(options?: FindAllOptions): Promise<FootballEvent[]> {
    const conditions = [];

    if (options?.competitionId) {
      conditions.push(eq(footballEventsTable.competition_id, options.competitionId));
    }
    if (options?.venueId) {
      conditions.push(eq(footballEventsTable.venue_id, options.venueId));
    }
    if (options?.status) {
      conditions.push(eq(footballEventsTable.status, options.status));
    }
    if (options?.isHot !== undefined) {
      conditions.push(eq(footballEventsTable.is_hot, options.isHot));
    }
    if (options?.slug) {
      conditions.push(eq(footballEventsTable.slug, options.slug));
    }

    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;

    return this.db
      .select()
      .from(footballEventsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(footballEventsTable.starts_at))
      .limit(limit)
      .offset(offset);
  }

  async findById(id: string): Promise<FootballEvent | null> {
    const rows = await this.db
      .select()
      .from(footballEventsTable)
      .where(eq(footballEventsTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findByEventNumber(eventNumber: number): Promise<FootballEvent | null> {
    const rows = await this.db
      .select()
      .from(footballEventsTable)
      .where(eq(footballEventsTable.event_number, eventNumber))
      .limit(1);
    return rows[0] ?? null;
  }

  async create(data: NewFootballEvent): Promise<FootballEvent> {
    try {
      const rows = await this.db
        .insert(footballEventsTable)
        .values(data)
        .returning();
      return rows[0];
    } catch (err: unknown) {
      handleDbError(err, { entityName: 'football event' });
      throw err;
    }
  }

  async update(id: string, data: Partial<NewFootballEvent>): Promise<FootballEvent | null> {
    try {
      const rows = await this.db
        .update(footballEventsTable)
        .set(data)
        .where(eq(footballEventsTable.id, id))
        .returning();
      return rows[0] ?? null;
    } catch (err: unknown) {
      handleDbError(err, { entityName: 'football event' });
      throw err;
    }
  }
}
