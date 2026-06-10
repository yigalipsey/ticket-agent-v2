/**
 * Base class for all football-event domain errors.
 * The repository throws these; the service translates them to HTTP exceptions.
 * This keeps HTTP concerns out of the data layer.
 */
export class FootballEventDomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    // Required for proper `instanceof` checks when extending built-in Error in TS.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DuplicateFieldError extends FootballEventDomainError {
  constructor(
    public readonly field: string,
    message: string,
  ) {
    super(message);
  }
}

export class InvalidForeignKeyError extends FootballEventDomainError {
  constructor(
    public readonly field: string,
    message: string,
  ) {
    super(message);
  }
}

export class CheckConstraintViolationError extends FootballEventDomainError {
  constructor(
    public readonly constraint: string,
    message: string,
  ) {
    super(message);
  }
}
