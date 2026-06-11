/**
 * Port (abstraction) for resolving a team's slug from its ID.
 *
 * Consumers depend on this interface — not on any concrete service or repository —
 * so the implementation can be swapped without touching business logic.
 * This is the "primary port" side of a hexagonal / ports-and-adapters architecture.
 */
export interface TeamLookupPort {
  findSlugById(teamId: string): Promise<string | null>;
}

/**
 * NestJS injection token.
 * Use `@Inject(TEAM_LOOKUP_PORT)` in consumers to receive the adapter wired by
 * the TeamsModule custom provider.
 */
export const TEAM_LOOKUP_PORT = Symbol('TEAM_LOOKUP_PORT');
