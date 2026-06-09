import type { citiesTable } from "./cities.schema";

export type City = typeof citiesTable.$inferSelect;
export type NewCity = typeof citiesTable.$inferInsert;
