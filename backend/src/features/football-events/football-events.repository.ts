import { Inject, Injectable } from '@nestjs/common';
import { eq, and, ne, asc } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../db/drizzle.provider';
import type * as schema from '../../db/schema';
import { footballEventsTable } from './football-events.schema';
import { teamsTable } from '../teams/teams.schema';
import type { FootballEvent, NewFootballEvent, EventStatus } from './football-events.types';
import {
  CheckConstraintViolationError,
  DuplicateFieldError,
  InvalidForeignKeyError,
} from './football-events.errors';

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

  /**
   * Used by the service for auto-generating event slugs from a team's canonical slug.
   * Still cross-feature, but intentionally kept here because slug generation requires
   * a team lookup and this is the only remaining cross-feature access.
   */
  async findTeamSlugById(teamId: string): Promise<string | null> {
    const rows = await this.db
      .select({ slug: teamsTable.slug })
      .from(teamsTable)
      .where(eq(teamsTable.id, teamId))
      .limit(1);
    return rows[0]?.slug ?? null;
  }

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
      this.handleDbError(err);
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
      this.handleDbError(err);
      throw err;
    }
  }

  /**
   * Translates Postgres error codes into domain errors.
   * Intentionally throws domain errors (not HTTP exceptions) — the service is
   * responsible for translating those to the correct HTTP response.
   */
  private handleDbError(err: unknown): void {
    if (typeof err !== 'object' || err === null || !('code' in err)) return;

    const { code, detail = '', constraint = '' } = err as {
      code: string;
      detail?: string;
      constraint?: string;
    };

    // Check constraint violation
    if (code === '23514') {
      if (constraint.includes('home_team_xor_check') || detail.includes('home_team')) {
        throw new CheckConstraintViolationError(
          'home_team_xor_check',
          'Exactly one of home_team_id or home_team_name must be set.',
        );
      }
      if (constraint.includes('away_team_xor_check') || detail.includes('away_team')) {
        throw new CheckConstraintViolationError(
          'away_team_xor_check',
          'Exactly one of away_team_id or away_team_name must be set.',
        );
      }
      throw new CheckConstraintViolationError('unknown', 'Database check constraint violated.');
    }

    // Foreign key violation
    if (code === '23503') {
      if (detail.includes('competition_id')) {
        throw new InvalidForeignKeyError(
          'competition_id',
          'Invalid competition_id: referenced competition does not exist',
        );
      }
      if (detail.includes('venue_id')) {
        throw new InvalidForeignKeyError(
          'venue_id',
          'Invalid venue_id: referenced venue does not exist',
        );
      }
      if (detail.includes('home_team_id')) {
        throw new InvalidForeignKeyError(
          'home_team_id',
          'Invalid home_team_id: referenced home team does not exist',
        );
      }
      if (detail.includes('away_team_id')) {
        throw new InvalidForeignKeyError(
          'away_team_id',
          'Invalid away_team_id: referenced away team does not exist',
        );
      }
      throw new InvalidForeignKeyError('unknown', 'Foreign key constraint violated.');
    }

    // Unique constraint violation
    if (code === '23505') {
      if (detail.includes('slug')) {
        throw new DuplicateFieldError('slug', 'An event with this slug already exists');
      }
      if (detail.includes('event_number')) {
        throw new DuplicateFieldError('event_number', 'An event with this event_number already exists');
      }
      if (detail.includes('api_football_external_id')) {
        throw new DuplicateFieldError(
          'api_football_external_id',
          'An event with this api_football_external_id already exists',
        );
      }
      if (detail.includes('football_data_external_id')) {
        throw new DuplicateFieldError(
          'football_data_external_id',
          'An event with this football_data_external_id already exists',
        );
      }
      throw new DuplicateFieldError('unknown', 'A unique constraint was violated.');
    }
  }
}
