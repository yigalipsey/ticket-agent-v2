import type { competitionsTable } from './competitions.schema';

export type Competition = typeof competitionsTable.$inferSelect;
export type NewCompetition = typeof competitionsTable.$inferInsert;
export type CompetitionType = Competition['type'];
