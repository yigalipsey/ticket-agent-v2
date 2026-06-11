import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

// ---------------------------------------------------------------------------
// Domain error classes — thrown by repositories, translated by services
// ---------------------------------------------------------------------------

/**
 * Base class for all database domain errors.
 * Repositories throw these; services translate them to HTTP exceptions.
 * This keeps HTTP concerns out of the data layer.
 */
export class DbDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // Required for proper `instanceof` checks when extending built-in Error in TS.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DuplicateFieldError extends DbDomainError {
  constructor(
    public readonly field: string,
    message: string,
  ) {
    super(message);
  }
}

export class InvalidForeignKeyError extends DbDomainError {
  constructor(
    public readonly field: string,
    message: string,
  ) {
    super(message);
  }
}

export class CheckConstraintViolationError extends DbDomainError {
  constructor(
    public readonly constraint: string,
    message: string,
  ) {
    super(message);
  }
}

// ---------------------------------------------------------------------------
// Error context
// ---------------------------------------------------------------------------

export interface ErrorContext {
  /** Human-readable name of the entity (e.g. "city", "team", "venue"). */
  entityName?: string;
}

// ---------------------------------------------------------------------------
// handleDbError — maps Postgres error codes to domain errors
// ---------------------------------------------------------------------------

/**
 * Inspects a caught Postgres error and throws the appropriate domain error.
 * If the error is not a recognised Postgres error, this function returns
 * without throwing — the caller should re-throw the original error.
 *
 * @example
 * try {
 *   return await this.db.insert(citiesTable).values(data).returning();
 * } catch (err: unknown) {
 *   handleDbError(err, { entityName: 'city' });
 *   throw err;  // re-throw non-PG errors
 * }
 */
export function handleDbError(err: unknown, context?: ErrorContext): void {
  if (typeof err !== 'object' || err === null || !('code' in err)) return;

  const { code, detail = '', constraint = '' } = err as {
    code: string;
    detail?: string;
    constraint?: string;
  };

  const entity = context?.entityName ?? 'record';

  // Extract the affected column name from PG's detail string.
  // Format: "Key (column_name)=(value) is not present in table …" (FK)
  //         "Key (column_name)=(value) already exists."              (unique)
  //         "Key (col1, col2)=(…, …) already exists."                (composite unique)
  const fieldMatch = detail.match(/Key \(([^)]+)\)/);
  const field = fieldMatch?.[1] ?? 'unknown';

  // ------------------------------------------------------------------
  // Check constraint violation (PG code 23514)
  // ------------------------------------------------------------------
  if (code === '23514') {
    throw new CheckConstraintViolationError(
      constraint || 'unknown',
      `Check constraint violated on ${entity}: ${constraint || 'unknown'}`,
    );
  }

  // ------------------------------------------------------------------
  // Foreign key violation (PG code 23503)
  // ------------------------------------------------------------------
  if (code === '23503') {
    // detail for FK violations can list multiple columns; take the first
    const fkField = field.split(',')[0].trim();
    throw new InvalidForeignKeyError(
      fkField,
      `Invalid ${fkField}: referenced record does not exist`,
    );
  }

  // ------------------------------------------------------------------
  // Unique constraint violation (PG code 23505)
  // ------------------------------------------------------------------
  if (code === '23505') {
    const columns = field.split(',').map((c: string) => c.trim());
    const primaryField = columns[0];
    throw new DuplicateFieldError(
      primaryField,
      `A ${entity} with this ${primaryField} already exists`,
    );
  }
}

// ---------------------------------------------------------------------------
// translateDomainError — translates domain errors to HTTP exceptions
// ---------------------------------------------------------------------------

/**
 * Translates domain errors thrown by repositories into NestJS HTTP exceptions.
 * Call this inside a catch block in the service layer.
 *
 * If the error is not a recognised domain error, this function returns
 * without throwing — the caller should re-throw the original error.
 *
 * @example
 * try {
 *   return await this.repository.create(data);
 * } catch (err) {
 *   translateDomainError(err);
 *   throw err;
 * }
 */
export function translateDomainError(err: unknown): void {
  if (err instanceof DuplicateFieldError) {
    throw new ConflictException(err.message);
  }
  if (
    err instanceof InvalidForeignKeyError ||
    err instanceof CheckConstraintViolationError
  ) {
    throw new BadRequestException(err.message);
  }
}
