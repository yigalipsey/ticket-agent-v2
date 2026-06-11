import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { TeamCompetitionsModule } from '../team-competitions/team-competitions.module';
import { CompetitionsController } from './competitions.controller';
import { CompetitionsRepository } from './competitions.repository';
import { CompetitionsService } from './competitions.service';

@Module({
  imports: [DbModule, TeamCompetitionsModule],
  controllers: [CompetitionsController],
  providers: [CompetitionsService, CompetitionsRepository],
})
export class CompetitionsModule {}
