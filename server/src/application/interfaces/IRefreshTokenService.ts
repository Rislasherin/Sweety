export interface IRefreshTokenService {
  generateToken(): string;
  hashToken(rawToken: string): string;
  getExpirationDate(): Date;
}
