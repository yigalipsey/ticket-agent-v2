import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { TeamsModule } from '../teams/teams.module';
import { TeamsService } from '../teams/teams.service';
import { SuppliersController } from './suppliers.controller';
import { SuppliersRepository } from './suppliers.repository';
import { SuppliersService } from './suppliers.service';
import { TeamMappingRepository } from './mappings/team-mapping.repository';
import { TeamMappingService } from './mappings/team-mapping.service';
import { TEAM_VALIDATOR_TOKEN } from './mappings/team-mapping.interface';

@Module({
  imports: [DbModule, TeamsModule],
  controllers: [SuppliersController],
  providers: [
    SuppliersService,
    SuppliersRepository,
    TeamMappingRepository,
    TeamMappingService,
    {
      provide: TEAM_VALIDATOR_TOKEN,
      useExisting: TeamsService,
    },
  ],
  exports: [SuppliersService, TeamMappingService],
})
export class SuppliersModule { }
