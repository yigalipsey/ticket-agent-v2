import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { TeamMappingRepository } from './team-mapping.repository';
import type { NewTeamSupplierMapping } from './team-mapping.schema';
import { TEAM_VALIDATOR_TOKEN, type TeamValidator } from './team-mapping.interface';

@Injectable()
export class TeamMappingService {
  constructor(
    private readonly repository: TeamMappingRepository,
    @Inject(TEAM_VALIDATOR_TOKEN) private readonly teamValidator: TeamValidator,
  ) {}

  /**
   * Auto-captures a mapping during ingest, safely inserting or updating it.
   */
  async upsertMapping(mapping: NewTeamSupplierMapping) {
    const teamSlug = await this.teamValidator.findSlugById(mapping.team_id);
    if (!teamSlug) {
      throw new NotFoundException(`Team with ID ${mapping.team_id} does not exist.`);
    }

    return this.repository.createOrUpdate(mapping);
  }

  /**
   * Approves a mapping, enabling tickets to flow during sync.
   */
  async verifyMapping(id: string) {
    const verified = await this.repository.verify(id);
    if (!verified) {
      throw new NotFoundException(`Mapping with ID ${id} not found.`);
    }
    return verified;
  }

  async findByExternalId(supplierId: string, externalId: string) {
    return this.repository.findByExternalId(supplierId, externalId);
  }
}
