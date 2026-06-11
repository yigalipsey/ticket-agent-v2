export const TEAM_VALIDATOR_TOKEN = Symbol('TEAM_VALIDATOR_TOKEN');

export interface TeamValidator {
  /**
   * Retrieves the team's slug if it exists. Returns null if not found.
   */
  findSlugById(teamId: string): Promise<string | null>;
}
