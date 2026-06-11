import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { TeamsModule } from '../teams/teams.module';
import { FootballEventsController } from './football-events.controller';
import { FootballEventsRepository } from './football-events.repository';
import { FootballEventsService } from './football-events.service';

@Module({
  imports: [DbModule, TeamsModule],
  controllers: [FootballEventsController],
  providers: [FootballEventsService, FootballEventsRepository],
  exports: [FootballEventsService],
})
export class FootballEventsModule {}
