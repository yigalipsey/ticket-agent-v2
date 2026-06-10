import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { VenuesController } from './venues.controller';
import { VenuesRepository } from './venues.repository';
import { VenuesService } from './venues.service';

@Module({
  imports: [DbModule],
  controllers: [VenuesController],
  providers: [VenuesService, VenuesRepository],
  exports: [VenuesService],
})
export class VenuesModule {}
