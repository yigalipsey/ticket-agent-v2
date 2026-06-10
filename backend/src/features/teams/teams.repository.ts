import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { eq, or, ilike, and } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../db/drizzle.provider';
import type * as schema from '../../db/schema';
import { teamsTable } from './teams.schema';
import type { NewTeam } from './teams.types';
import { competitionsTable } from '../competitions/competitions.schema';
import { teamCompetitionsTable } from '../team-competitions/team-competitions.schema';


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
    
    const team = rows[0] ?? null;
    if (!team) {
      return null;
    }

    const competitions = await this.db
      .select({
        id: competitionsTable.id,
        name: competitionsTable.name,
        name_en: competitionsTable.name_en,
        slug: competitionsTable.slug,
        logo_url: competitionsTable.logo_url,
        image_url: competitionsTable.image_url,
        banner_url: competitionsTable.banner_url,
        description: competitionsTable.description,
        type: competitionsTable.type,
        is_popular: competitionsTable.is_popular,
        api_competition_id: competitionsTable.api_competition_id,
        created_at: competitionsTable.created_at,
        updated_at: competitionsTable.updated_at,
      })
      .from(teamCompetitionsTable)
      .innerJoin(
        competitionsTable,
        eq(teamCompetitionsTable.competition_id, competitionsTable.id),
      )
      .where(
        and(
          eq(teamCompetitionsTable.team_id, team.id),
          eq(teamCompetitionsTable.status, 'active'),
        ),
      );

    return {
      ...team,
      competitions,
    };
  }

  async create(data: NewTeam) {
    try {
      const rows = await this.db
        .insert(teamsTable)
        .values(data)
        .returning();
      return rows[0];
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err) {
        const code = (err as { code: string }).code;
        if (code === '23505') {
          const detail = (err as { detail?: string }).detail || '';
          if (detail.includes('slug')) {
            throw new ConflictException('A team with this slug already exists');
          }
          if (detail.includes('api_football_id')) {
            throw new ConflictException(
              'A team with this api_football_id already exists',
            );
          }
          throw new ConflictException(
            'A team with this slug or api_football_id already exists',
          );
        }
      }
      throw err;
    }
  }
}
