export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidEmailError extends DomainError {
  readonly code = "INVALID_EMAIL";
  constructor(raw: string) {
    super(`Invalid email: ${raw}`);
  }
}

export class WeakPasswordError extends DomainError {
  readonly code = "WEAK_PASSWORD";
  constructor(reason: string) {
    super(`Password does not meet policy: ${reason}`);
  }
}

export class EmailAlreadyTakenError extends DomainError {
  readonly code = "EMAIL_ALREADY_TAKEN";
  constructor(email: string) {
    super(`Email is already registered: ${email}`);
  }
}

export class InvalidCredentialsError extends DomainError {
  readonly code = "INVALID_CREDENTIALS";
  constructor() {
    super("Invalid email or password");
  }
}

export class InvalidResetTokenError extends DomainError {
  readonly code = "INVALID_RESET_TOKEN";
  constructor() {
    super("Reset token is invalid");
  }
}

export class ResetTokenExpiredError extends DomainError {
  readonly code = "RESET_TOKEN_EXPIRED";
  constructor() {
    super("Reset token has expired");
  }
}

export class ResetTokenAlreadyUsedError extends DomainError {
  readonly code = "RESET_TOKEN_ALREADY_USED";
  constructor() {
    super("Reset token has already been used");
  }
}

export class TooManyResetRequestsError extends DomainError {
  readonly code = "TOO_MANY_RESET_REQUESTS";
  constructor() {
    super("Too many password reset requests");
  }
}
