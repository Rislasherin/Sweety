import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { type ITokenService, type TokenPayload } from "@application/interfaces/ITokenService";

export interface JwtConfig {
  secret: string;
  expiresIn?: string;
  issuer?: string;
  audience?: string;
}

export class JwtTokenService implements ITokenService {
  private readonly secret: string;
  private readonly expiresIn: string;
  private readonly issuer: string;
  private readonly audience: string;

  constructor(config: JwtConfig) {
    if (!config.secret) {
      throw new Error("JWT secret must be provided");
    }
    this.secret = config.secret;
    this.expiresIn = config.expiresIn ?? "15m";
    this.issuer = config.issuer ?? "sweety-api";
    this.audience = config.audience ?? "sweety-client";
  }

  generate(payload: TokenPayload): string {
    const options: SignOptions = {
      expiresIn: this.expiresIn as SignOptions["expiresIn"],
      algorithm: "HS256",
      issuer: this.issuer,
      audience: this.audience,
    };

    return jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        jti: payload.jti ?? crypto.randomUUID(),
        type: "access",
      },
      this.secret,
      options,
    );
  }

  verify(token: string): TokenPayload {
    const decoded = jwt.verify(token, this.secret, {
      algorithms: ["HS256"],
      issuer: this.issuer,
      audience: this.audience,
    }) as {
      userId?: string;
      email?: string;
      jti?: string;
      type?: string;
      iss?: string;
      aud?: string;
    };

    if (!decoded.userId || !decoded.email) {
      throw new Error("Invalid token payload");
    }

    if (decoded.type && decoded.type !== "access") {
      throw new Error("Invalid token type: expected access token");
    }

    return {
      userId: decoded.userId,
      email: decoded.email,
    };
  }
}
