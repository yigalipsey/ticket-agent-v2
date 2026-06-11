import { Module } from "@nestjs/common";
import { ConfigModule } from "./config/config.module";
import { DbModule } from "./db/db.module";
import { CountriesModule } from "./features/countries/countries.module";
import { CitiesModule } from "./features/cities/cities.module";
import { CompetitionsModule } from "./features/competitions/competitions.module";
import { TeamsModule } from "./features/teams/teams.module";
import { VenuesModule } from "./features/venues/venues.module";
import { TeamCompetitionsModule } from "./features/team-competitions/team-competitions.module";
import { FootballEventsModule } from "./features/football-events/football-events.module";

@Module({
  imports: [
    ConfigModule,
    DbModule,
    CountriesModule,
    CitiesModule,
    CompetitionsModule,
    TeamsModule,
    VenuesModule,
    TeamCompetitionsModule,
    FootballEventsModule,
  ],
})
export class AppModule {}
