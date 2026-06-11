/**
 * Re-exports from the shared DB error-handling module.
 *
 * Kept for backward compatibility — new code should import directly from
 * `../../db/error-handler`.
 */
export {
  DbDomainError as FootballEventDomainError,
  DuplicateFieldError,
  InvalidForeignKeyError,
  CheckConstraintViolationError,
} from '../../db/error-handler';
