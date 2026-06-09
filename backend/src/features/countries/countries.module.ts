import { Module } from '@nestjs/common';
import { DbModule } from '../../db/db.module';
import { CountriesController } from './countries.controller';
import { CountriesRepository } from './countries.repository';
import { CountriesService } from './countries.service';

@Module({
  imports: [DbModule],
  controllers: [CountriesController],
  providers: [CountriesService, CountriesRepository],
})
export class CountriesModule {}
