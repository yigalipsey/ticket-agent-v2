import {
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../db/drizzle.provider';
import type * as schema from '../../db/schema';
import { handleDbError } from '../../db/error-handler';
import { teamCompetitionsTable } from './team-competitions.schema';
import { teamsTable } from '../teams/teams.schema';
import { competitionsTable } from '../competitions/competitions.schema';
import type { NewTeamCompetition } from './team-competitions.types';

type DrizzleDb = PostgresJsDatabase<typeof schema>;

@Injectable()
export class TeamCompetitionsRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async create(data: NewTeamCompetition) {
    try {
      const rows = await this.db
        .insert(teamCompetitionsTable)
        .values(data)
        .returning();
      return rows[0];
    } catch (err: unknown) {
      handleDbError(err, { entityName: 'team competition' });
      throw err;
    }
  }

  async updateStatus(
    teamId: string,
    competitionId: string,
    season: string,
    status: 'active' | 'eliminated' | 'relegated' | 'withdrawn',
  ) {
    const rows = await this.db
      .update(teamCompetitionsTable)
      .set({ status, updated_at: new Date() })
      .where(
        and(
          eq(teamCompetitionsTable.team_id, teamId),
          eq(teamCompetitionsTable.competition_id, competitionId),
          eq(teamCompetitionsTable.season, season),
        ),
      )
      .returning();

    if (rows.length === 0) {
      throw new NotFoundException(
        'Team competition mapping not found for the specified team, competition, and season',
      );
    }
    return rows[0];
  }

  async delete(teamId: string, competitionId: string, season: string) {
    const rows = await this.db
      .delete(teamCompetitionsTable)
      .where(
        and(
          eq(teamCompetitionsTable.team_id, teamId),
          eq(teamCompetitionsTable.competition_id, competitionId),
          eq(teamCompetitionsTable.season, season),
        ),
      )
      .returning();

    if (rows.length === 0) {
      throw new NotFoundException(
        'Team competition mapping not found for the specified team, competition, and season',
      );
    }
    return rows[0];
  }

  async findActiveCompetitionsForTeam(teamId: string) {
    return this.db
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
          eq(teamCompetitionsTable.team_id, teamId),
          eq(teamCompetitionsTable.status, 'active'),
        ),
      );
  }

  async findActiveTeamsForCompetition(competitionId: string) {
    return this.db
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
          eq(teamCompetitionsTable.competition_id, competitionId),
          eq(teamCompetitionsTable.status, 'active'),
        ),
      );
  }
}
