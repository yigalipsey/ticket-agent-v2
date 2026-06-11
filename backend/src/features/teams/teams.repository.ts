import { Inject, Injectable } from '@nestjs/common';
import { eq, or, ilike, and } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../db/drizzle.provider';
import type * as schema from '../../db/schema';
import { handleDbError } from '../../db/error-handler';
import { teamsTable } from './teams.schema';
import type { NewTeam } from './teams.types';


type DrizzleDb = PostgresJsDatabase<typeof schema>;

@Injectable()
export class TeamsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findAll(options?: { popularOnly?: boolean; search?: string }) {
    const conditions = [];

    if (options?.popularOnly) {
      conditions.push(eq(teamsTable.is_popular, true));
    }

    if (options?.search) {
      const searchPattern = `%${options.search}%`;
      conditions.push(
        or(
          ilike(teamsTable.name, searchPattern),
          ilike(teamsTable.name_en, searchPattern),
          ilike(teamsTable.slug, searchPattern),
        ),
      );
    }

    if (conditions.length > 0) {
      return this.db
        .select()
        .from(teamsTable)
        .where(and(...conditions));
    }

    return this.db.select().from(teamsTable);
  }

  async findBySlug(slug: string) {
    const rows = await this.db
      .select()
      .from(teamsTable)
      .where(eq(teamsTable.slug, slug));
    return rows[0] ?? null;
  }

  async findSlugById(teamId: string): Promise<string | null> {
    const rows = await this.db
      .select({ slug: teamsTable.slug })
      .from(teamsTable)
      .where(eq(teamsTable.id, teamId))
      .limit(1);
    return rows[0]?.slug ?? null;
  }

  async create(data: NewTeam) {
    try {
      const rows = await this.db
        .insert(teamsTable)
        .values(data)
        .returning();
      return rows[0];
    } catch (err: unknown) {
      handleDbError(err, { entityName: 'team' });
      throw err;
    }
  }
}
