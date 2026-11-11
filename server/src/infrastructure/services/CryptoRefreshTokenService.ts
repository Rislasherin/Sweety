import crypto from "node:crypto";
import { type IRefreshTokenService } from "@application/interfaces/IRefreshTokenService";

export class CryptoRefreshTokenService implements IRefreshTokenService {
  constructor(private readonly ttlDays: number = 7) {}

  generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  hashToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }

  getExpirationDate(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.ttlDays);
    return expiresAt;
  }
}
