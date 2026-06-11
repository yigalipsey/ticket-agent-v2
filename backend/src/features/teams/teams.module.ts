import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { TEAM_LOOKUP_PORT } from '../../common/ports/team-lookup.port';
import { TeamCompetitionsModule } from '../team-competitions/team-competitions.module';
import { TeamLookupAdapter } from './adapters/team-lookup.adapter';
import { TeamsController } from './teams.controller';
import { TeamsRepository } from './teams.repository';
import { TeamsService } from './teams.service';

@Module({
  imports: [DbModule, TeamCompetitionsModule],
  controllers: [TeamsController],
  providers: [
    TeamsService,
    TeamsRepository,
    TeamLookupAdapter,
    {
      provide: TEAM_LOOKUP_PORT,
      useExisting: TeamLookupAdapter,
    },
  ],
  exports: [TeamsService, TEAM_LOOKUP_PORT],
})
export class TeamsModule {}
