import type { suppliersTable } from './suppliers.schema';
import type { SupplierOrigin } from './suppliers.schema';

export type Supplier = typeof suppliersTable.$inferSelect;
export type InsertSupplier = typeof suppliersTable.$inferInsert;
export type NewSupplier = typeof suppliersTable.$inferInsert;

export type { SupplierOrigin };
