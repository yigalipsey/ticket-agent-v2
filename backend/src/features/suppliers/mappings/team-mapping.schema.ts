import {
  boolean,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  jsonb,
} from 'drizzle-orm/pg-core';
import { teamsTable } from '../../teams/teams.schema';
import { suppliersTable } from '../suppliers.schema';

export const teamSupplierMappingsTable = pgTable(
  'team_supplier_mappings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    team_id: uuid('team_id')
      .notNull()
      .references(() => teamsTable.id),
    supplier_id: uuid('supplier_id')
      .notNull()
      .references(() => suppliersTable.id),
    supplier_team_name: text('supplier_team_name'),
    supplier_external_id: text('supplier_external_id').notNull(),
    is_verified: boolean('is_verified').notNull().default(false),
    metadata: jsonb('metadata'),
    created_at: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    uniqueSupplierTeam: unique('uq_team_supplier_mapping_supplier_team').on(
      table.supplier_id,
      table.team_id,
    ),
    uniqueSupplierExternalId: unique(
      'uq_team_supplier_mapping_supplier_external',
    ).on(table.supplier_id, table.supplier_external_id),
  }),
);

export type TeamSupplierMapping = typeof teamSupplierMappingsTable.$inferSelect;
export type NewTeamSupplierMapping = typeof teamSupplierMappingsTable.$inferInsert;
