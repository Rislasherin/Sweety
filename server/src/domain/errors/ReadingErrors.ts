import { DomainError } from "./DomainError";

export class ReadingNotFoundError extends DomainError {
  constructor(message = "Reading not found") {
    super(message);
    this.name = "ReadingNotFoundError";
  }
}

export class DuplicateReadingSlotError extends DomainError {
  constructor(message = "A reading for this slot already exists on this date") {
    super(message);
    this.name = "DuplicateReadingSlotError";
  }
}

export class DailyReadingLimitExceededError extends DomainError {
  constructor(message = "Daily reading limit of 4 readings has been reached for this date") {
    super(message);
    this.name = "DailyReadingLimitExceededError";
  }
}

export class FutureDateError extends DomainError {
  constructor(message = "Future dates are not allowed") {
    super(message);
    this.name = "FutureDateError";
  }
}

export class InvalidDateError extends DomainError {
  constructor(message = "Invalid date format. Expected YYYY-MM-DD") {
    super(message);
    this.name = "InvalidDateError";
  }
}
