import type { countriesTable } from './countries.schema';

export type Country = typeof countriesTable.$inferSelect;
export type NewCountry = typeof countriesTable.$inferInsert;
