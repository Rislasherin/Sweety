export class UserAlreadyExistsError extends Error {
  constructor() {
    super("An account with this email already exists");

    this.name = "UserAlreadyExistsError";

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
