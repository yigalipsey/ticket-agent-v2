import { Inject, Injectable } from '@nestjs/common';
import { eq, or, ilike, and } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../db/drizzle.provider';
import type * as schema from '../../db/schema';
import { handleDbError } from '../../db/error-handler';
import { venuesTable } from './venues.schema';
import type { NewVenue } from './venues.types';

type DrizzleDb = PostgresJsDatabase<typeof schema>;

@Injectable()
export class VenuesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findAll(options?: { popularOnly?: boolean; search?: string; cityId?: string }) {
    const conditions = [];

    if (options?.popularOnly) {
      conditions.push(eq(venuesTable.is_popular, true));
    }

    if (options?.cityId) {
      conditions.push(eq(venuesTable.city_id, options.cityId));
    }

    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      conditions.push(
        or(
          ilike(venuesTable.name, searchPattern),
          ilike(venuesTable.name_en, searchPattern),
          ilike(venuesTable.slug, searchPattern),
        ),
      );
    }

    if (conditions.length > 0) {
      return this.db
        .select()
        .from(venuesTable)
        .where(and(...conditions));
    }

    return this.db.select().from(venuesTable);
  }

  async findBySlug(slug: string) {
    const rows = await this.db
      .select()
      .from(venuesTable)
      .where(eq(venuesTable.slug, slug));
    return rows[0] ?? null;
  }

  async create(data: NewVenue) {
    try {
      const rows = await this.db
        .insert(venuesTable)
        .values(data)
        .returning();
      return rows[0];
    } catch (err: unknown) {
      handleDbError(err, { entityName: 'venue' });
      throw err;
    }
  }
}
