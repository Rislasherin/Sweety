export class InvalidRefreshTokenError extends Error {
  constructor(message: string = "Invalid or expired refresh token") {
    super(message);
    this.name = "InvalidRefreshTokenError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
