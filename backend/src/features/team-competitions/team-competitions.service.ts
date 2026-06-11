import { Injectable, NotFoundException } from '@nestjs/common';
import { TeamCompetitionsRepository } from './team-competitions.repository';
import type { CreateTeamCompetitionDto } from './dto/create-team-competition.dto';
import { translateDomainError } from '../../db/error-handler';

@Injectable()
export class TeamCompetitionsService {
  constructor(
    private readonly teamCompetitionsRepository: TeamCompetitionsRepository,
  ) {}

  async create(dto: CreateTeamCompetitionDto) {
    try {
      return await this.teamCompetitionsRepository.create({
        team_id: dto.teamId,
        competition_id: dto.competitionId,
        season: dto.season,
        status: dto.status ?? 'active',
      });
    } catch (err) {
      translateDomainError(err);
      throw err;
    }
  }

  async updateStatus(
    teamId: string,
    competitionId: string,
    season: string,
    status: 'active' | 'eliminated' | 'relegated' | 'withdrawn',
  ) {
    const result = await this.teamCompetitionsRepository.updateStatus(
      teamId,
      competitionId,
      season,
      status,
    );
    if (!result) {
      throw new NotFoundException(
        'Team competition mapping not found for the specified team, competition, and season',
      );
    }
    return result;
  }

  async delete(teamId: string, competitionId: string, season: string) {
    const result = await this.teamCompetitionsRepository.delete(
      teamId,
      competitionId,
      season,
    );
    if (!result) {
      throw new NotFoundException(
        'Team competition mapping not found for the specified team, competition, and season',
      );
    }
    return result;
  }
}
