import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../db/drizzle.provider';
import type * as schema from '../../db/schema';
import { handleDbError } from '../../db/error-handler';
import { citiesTable } from './cities.schema';
import type { NewCity } from './cities.types';

type DrizzleDb = PostgresJsDatabase<typeof schema>;

@Injectable()
export class CitiesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findAll(options?: { popularOnly?: boolean }) {
    if (options?.popularOnly) {
      return this.db
        .select()
        .from(citiesTable)
        .where(eq(citiesTable.is_popular, true));
    }
    return this.db.select().from(citiesTable);
  }

  async findBySlug(slug: string) {
    const rows = await this.db
      .select()
      .from(citiesTable)
      .where(eq(citiesTable.slug, slug));
    return rows[0] ?? null;
  }

  async create(data: NewCity) {
    try {
      const rows = await this.db
        .insert(citiesTable)
        .values(data)
        .returning();
      return rows[0];
    } catch (err: unknown) {
      handleDbError(err, { entityName: 'city' });
      throw err;
    }
  }
}
