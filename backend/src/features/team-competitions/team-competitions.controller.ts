import {
  Body,
  Controller,
  Delete,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { TeamCompetitionsService } from './team-competitions.service';
import { CreateTeamCompetitionDto } from './dto/create-team-competition.dto';
import { UpdateTeamCompetitionStatusDto } from './dto/update-team-competition-status.dto';

@Controller('team-competitions')
export class TeamCompetitionsController {
  constructor(
    private readonly teamCompetitionsService: TeamCompetitionsService,
  ) {}

  @Post()
  @HttpCode(201)
  create(@Body() dto: CreateTeamCompetitionDto) {
    return this.teamCompetitionsService.create(dto);
  }

  @Patch(':teamId/:competitionId/:season')
  updateStatus(
    @Param('teamId') teamId: string,
    @Param('competitionId') competitionId: string,
    @Param('season') season: string,
    @Body() dto: UpdateTeamCompetitionStatusDto,
  ) {
    return this.teamCompetitionsService.updateStatus(
      teamId,
      competitionId,
      season,
      dto.status,
    );
  }

  @Delete(':teamId/:competitionId/:season')
  @HttpCode(200)
  delete(
    @Param('teamId') teamId: string,
    @Param('competitionId') competitionId: string,
    @Param('season') season: string,
  ) {
    return this.teamCompetitionsService.delete(teamId, competitionId, season);
  }
}
