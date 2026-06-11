import { Inject, Injectable } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../../db/drizzle.provider';
import type * as schema from '../../../db/schema';
import { teamSupplierMappingsTable } from './team-mapping.schema';
import type { NewTeamSupplierMapping, TeamSupplierMapping } from './team-mapping.schema';

type DrizzleDb = PostgresJsDatabase<typeof schema>;

@Injectable()
export class TeamMappingRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async createOrUpdate(mapping: NewTeamSupplierMapping): Promise<TeamSupplierMapping> {
    const rows = await this.db
      .insert(teamSupplierMappingsTable)
      .values(mapping)
      .onConflictDoUpdate({
        target: [teamSupplierMappingsTable.supplier_id, teamSupplierMappingsTable.supplier_external_id],
        set: {
          supplier_team_name: mapping.supplier_team_name,
          updated_at: new Date(),
        },
      })
      .returning();
    return rows[0];
  }

  async verify(id: string): Promise<TeamSupplierMapping | undefined> {
    const rows = await this.db
      .update(teamSupplierMappingsTable)
      .set({ is_verified: true, updated_at: new Date() })
      .where(eq(teamSupplierMappingsTable.id, id))
      .returning();
    return rows[0];
  }

  async findByExternalId(supplierId: string, externalId: string): Promise<TeamSupplierMapping | undefined> {
    const rows = await this.db
      .select()
      .from(teamSupplierMappingsTable)
      .where(
        and(
          eq(teamSupplierMappingsTable.supplier_id, supplierId),
          eq(teamSupplierMappingsTable.supplier_external_id, externalId)
        )
      )
      .limit(1);
    return rows[0];
  }
}
