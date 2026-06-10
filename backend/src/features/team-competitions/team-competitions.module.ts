import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { TeamCompetitionsController } from './team-competitions.controller';
import { TeamCompetitionsRepository } from './team-competitions.repository';
import { TeamCompetitionsService } from './team-competitions.service';

@Module({
  imports: [DbModule],
  controllers: [TeamCompetitionsController],
  providers: [TeamCompetitionsService, TeamCompetitionsRepository],
  exports: [TeamCompetitionsService, TeamCompetitionsRepository],
})
export class TeamCompetitionsModule {}
