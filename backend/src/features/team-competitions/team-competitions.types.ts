import type { teamCompetitionsTable } from './team-competitions.schema';

export type TeamCompetition = typeof teamCompetitionsTable.$inferSelect;
export type NewTeamCompetition = typeof teamCompetitionsTable.$inferInsert;
