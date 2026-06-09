import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DbModule } from './db/db.module';
import { CountriesModule } from './features/countries/countries.module';
import { CitiesModule } from './features/cities/cities.module';

@Module({
  imports: [ConfigModule, DbModule, CountriesModule, CitiesModule],
})
export class AppModule {}
