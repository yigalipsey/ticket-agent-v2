import { Injectable } from '@nestjs/common';
import { TeamCompetitionsRepository } from './team-competitions.repository';
import type { CreateTeamCompetitionDto } from './dto/create-team-competition.dto';

@Injectable()
export class TeamCompetitionsService {
  constructor(
    private readonly teamCompetitionsRepository: TeamCompetitionsRepository,
  ) {}

  async create(dto: CreateTeamCompetitionDto) {
    return this.teamCompetitionsRepository.create({
      team_id: dto.teamId,
      competition_id: dto.competitionId,
      season: dto.season,
      status: dto.status ?? 'active',
    });
  }

  async updateStatus(
    teamId: string,
    competitionId: string,
    season: string,
    status: 'active' | 'eliminated' | 'relegated' | 'withdrawn',
  ) {
    return this.teamCompetitionsRepository.updateStatus(
      teamId,
      competitionId,
      season,
      status,
    );
  }

  async delete(teamId: string, competitionId: string, season: string) {
    return this.teamCompetitionsRepository.delete(
      teamId,
      competitionId,
      season,
    );
  }
}
