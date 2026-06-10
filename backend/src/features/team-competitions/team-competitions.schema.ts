import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { teamsTable } from '../teams/teams.schema';
import { competitionsTable } from '../competitions/competitions.schema';

export const teamCompetitionStatusEnum = pgEnum('team_competition_status', [
  'active',
  'eliminated',
  'relegated',
  'withdrawn',
]);

export const teamCompetitionsTable = pgTable(
  'team_competitions',
  {
    team_id: uuid('team_id')
      .notNull()
      .references(() => teamsTable.id, { onDelete: 'cascade' }),
    competition_id: uuid('competition_id')
      .notNull()
      .references(() => competitionsTable.id, { onDelete: 'cascade' }),
    season: text('season').notNull(),
    status: teamCompetitionStatusEnum('status').notNull().default('active'),
    created_at: timestamp('created_at').notNull().defaultNow(),
    updated_at: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.team_id, table.competition_id, table.season] }),
    index('team_competitions_competition_id_idx').on(table.competition_id),
    index('team_competitions_competition_id_season_idx').on(
      table.competition_id,
      table.season,
    ),
    index('team_competitions_team_id_season_idx').on(
      table.team_id,
      table.season,
    ),
  ],
);
