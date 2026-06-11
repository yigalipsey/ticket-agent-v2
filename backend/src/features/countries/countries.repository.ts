import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../db/drizzle.provider';
import type * as schema from '../../db/schema';
import { handleDbError } from '../../db/error-handler';
import type { NewCountry } from './countries.types';
import { countriesTable } from './countries.schema';

type DrizzleDb = PostgresJsDatabase<typeof schema>;

@Injectable()
export class CountriesRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findAll() {
    return this.db.select().from(countriesTable);
  }

  async findBySlug(slug: string) {
    const rows = await this.db
      .select()
      .from(countriesTable)
      .where(eq(countriesTable.slug, slug));
    return rows[0] ?? null;
  }

  async create(data: NewCountry) {
    try {
      const rows = await this.db
        .insert(countriesTable)
        .values(data)
        .returning();
      return rows[0];
    } catch (err: unknown) {
      handleDbError(err, { entityName: 'country' });
      throw err;
    }
  }
}
