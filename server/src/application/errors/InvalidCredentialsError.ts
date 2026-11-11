export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password");

    this.name = "InvalidCredentialsError";

    Object.setPrototypeOf(this, new.target.prototype);
  }
}
