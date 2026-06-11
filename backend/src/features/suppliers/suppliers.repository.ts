import { Inject, Injectable } from '@nestjs/common';
import { eq, and, ne, asc } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../db/drizzle.provider';
import type * as schema from '../../db/schema';
import { suppliersTable } from './suppliers.schema';
import type { Supplier, NewSupplier } from './suppliers.types';
import { handleDbError } from '../../db/error-handler';

type DrizzleDb = PostgresJsDatabase<typeof schema>;

export type FindAllSuppliersOptions = {
  isActive?: boolean;
  slug?: string;
  limit?: number;
  offset?: number;
};

@Injectable()
export class SuppliersRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}

  async checkSlugExists(slug: string, excludeId?: string): Promise<boolean> {
    const conditions = [eq(suppliersTable.slug, slug)];
    if (excludeId) {
      conditions.push(ne(suppliersTable.id, excludeId));
    }
    const rows = await this.db
      .select({ id: suppliersTable.id })
      .from(suppliersTable)
      .where(and(...conditions))
      .limit(1);
    return rows.length > 0;
  }

  async findAll(options?: FindAllSuppliersOptions): Promise<Supplier[]> {
    const conditions = [];

    if (options?.isActive !== undefined) {
      conditions.push(eq(suppliersTable.is_active, options.isActive));
    }
    if (options?.slug) {
      conditions.push(eq(suppliersTable.slug, options.slug));
    }

    const limit = options?.limit ?? 20;
    const offset = options?.offset ?? 0;

    return this.db
      .select()
      .from(suppliersTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(suppliersTable.priority))
      .limit(limit)
      .offset(offset);
  }

  async findById(id: string): Promise<Supplier | null> {
    const rows = await this.db
      .select()
      .from(suppliersTable)
      .where(eq(suppliersTable.id, id))
      .limit(1);
    return rows[0] ?? null;
  }

  async findByInternalCode(internalCode: string): Promise<Supplier | null> {
    const rows = await this.db
      .select()
      .from(suppliersTable)
      .where(eq(suppliersTable.internal_code, internalCode))
      .limit(1);
    return rows[0] ?? null;
  }

  async create(data: NewSupplier): Promise<Supplier> {
    try {
      const rows = await this.db
        .insert(suppliersTable)
        .values(data)
        .returning();
      return rows[0];
    } catch (err: unknown) {
      handleDbError(err, { entityName: 'supplier' });
      throw err;
    }
  }

  async update(id: string, data: Partial<NewSupplier>): Promise<Supplier | null> {
    try {
      const rows = await this.db
        .update(suppliersTable)
        .set(data)
        .where(eq(suppliersTable.id, id))
        .returning();
      return rows[0] ?? null;
    } catch (err: unknown) {
      handleDbError(err, { entityName: 'supplier' });
      throw err;
    }
  }
}
