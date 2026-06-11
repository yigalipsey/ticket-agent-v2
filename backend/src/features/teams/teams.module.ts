import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { TeamCompetitionsModule } from '../team-competitions/team-competitions.module';
import { TeamsController } from './teams.controller';
import { TeamsRepository } from './teams.repository';
import { TeamsService } from './teams.service';

@Module({
  imports: [DbModule, TeamCompetitionsModule],
  controllers: [TeamsController],
  providers: [TeamsService, TeamsRepository],
  exports: [TeamsService],
})
export class TeamsModule {}
