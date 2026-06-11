import { Injectable } from '@nestjs/common';
import { TeamsRepository } from '../teams.repository';
import type { TeamLookupPort } from '../../../common/ports/team-lookup.port';

/**
 * Adapter that bridges the {@link TeamLookupPort} abstraction to the
 * concrete {@link TeamsRepository}.
 *
 * Part of the hexagonal / ports-and-adapters pattern:
 * - **Port** — `TeamLookupPort` (in `src/common/ports/`)
 * - **Adapter** — this class (in the teams feature module)
 * - **Consumer** — `FootballEventsService` injects the port, never the adapter
 *
 * This adapter is registered via a NestJS custom provider
 * (`useExisting: TeamLookupAdapter`) so the `TEAM_LOOKUP_PORT` injection token
 * resolves to this singleton.
 */
@Injectable()
export class TeamLookupAdapter implements TeamLookupPort {
  constructor(private readonly teamsRepository: TeamsRepository) {}

  async findSlugById(teamId: string): Promise<string | null> {
    const team = await this.teamsRepository.findById(teamId);
    return team?.slug ?? null;
  }
}
