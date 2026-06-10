import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../db/drizzle.provider';
import type * as schema from '../../db/schema';
import { competitionsTable } from './competitions.schema';
import type { CompetitionType, NewCompetition } from './competitions.types';
import { teamsTable } from '../teams/teams.schema';
import { teamCompetitionsTable } from '../team-competitions/team-competitions.schema';


type DrizzleDb = PostgresJsDatabase<typeof schema>;

@Injectable()
export class CompetitionsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async findAll(options?: {
    popularOnly?: boolean;
    type?: CompetitionType;
  }) {
    const conditions = [];

    if (options?.popularOnly) {
      conditions.push(eq(competitionsTable.is_popular, true));
    }

    if (options?.type) {
      conditions.push(eq(competitionsTable.type, options.type));
    }

    if (conditions.length === 0) {
      return this.db.select().from(competitionsTable);
    }

    return this.db
      .select()
      .from(competitionsTable)
      .where(and(...conditions));
  }

  async findBySlug(slug: string) {
    const rows = await this.db
      .select()
      .from(competitionsTable)
      .where(eq(competitionsTable.slug, slug));
    
    const competition = rows[0] ?? null;
    if (!competition) {
      return null;
    }

    const teams = await this.db
      .select({
        id: teamsTable.id,
        name: teamsTable.name,
        name_en: teamsTable.name_en,
        code: teamsTable.code,
        slug: teamsTable.slug,
        logo_url: teamsTable.logo_url,
        shirt_image_url: teamsTable.shirt_image_url,
        image_url: teamsTable.image_url,
        banner_url: teamsTable.banner_url,
        primary_color: teamsTable.primary_color,
        secondary_color: teamsTable.secondary_color,
        api_football_id: teamsTable.api_football_id,
        is_popular: teamsTable.is_popular,
        created_at: teamsTable.created_at,
        updated_at: teamsTable.updated_at,
      })
      .from(teamCompetitionsTable)
      .innerJoin(
        teamsTable,
        eq(teamCompetitionsTable.team_id, teamsTable.id),
      )
      .where(
        and(
          eq(teamCompetitionsTable.competition_id, competition.id),
          eq(teamCompetitionsTable.status, 'active'),
        ),
      );

    return {
      ...competition,
      teams,
    };
  }

  async create(data: NewCompetition) {
    try {
      const rows = await this.db
        .insert(competitionsTable)
        .values(data)
        .returning();
      return rows[0];
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'code' in err) {
        const code = (err as { code: string }).code;
        if (code === '23503') {
          throw new BadRequestException(
            'Invalid country_id or parent_competition_id: referenced record does not exist',
          );
        }
        if (code === '23505') {
          throw new ConflictException(
            'A competition with this slug or api_competition_id already exists',
          );
        }
      }
      throw err;
    }
  }
}
