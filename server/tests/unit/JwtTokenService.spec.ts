import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { JwtTokenService } from "@infrastructure/services/JwtTokenService";

describe("JwtTokenService Unit Tests", () => {
  const secret = "test-secret-key-1234567890-secure";
  const tokenService = new JwtTokenService({
    secret,
    expiresIn: "1h",
    issuer: "sweety-api",
    audience: "sweety-client",
  });

  const payload = {
    userId: "uuid-test-123",
    email: "user@example.com",
  };

  it("1. Generates a signed JWT string with configured claims", () => {
    const token = tokenService.generate(payload);

    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // JWT format: header.payload.signature

    const decodedRaw = jwt.decode(token) as Record<string, unknown>;
    expect(decodedRaw.iss).toBe("sweety-api");
    expect(decodedRaw.aud).toBe("sweety-client");
    expect(decodedRaw.type).toBe("access");
    expect(decodedRaw.userId).toBe(payload.userId);
    expect(decodedRaw.email).toBe(payload.email);
  });

  it("2. Verifies and extracts payload from a valid token", () => {
    const token = tokenService.generate(payload);
    const decoded = tokenService.verify(token);

    expect(decoded).toEqual({
      userId: "uuid-test-123",
      email: "user@example.com",
    });
  });

  it("3. Throws error on invalid or tampered signature", () => {
    const token = tokenService.generate(payload);
    const tampered = token.slice(0, -6) + "xyz123";

    expect(() => tokenService.verify(tampered)).toThrow();
  });

  it("4. Throws error when token has incorrect issuer", () => {
    const foreignToken = jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        type: "access",
      },
      secret,
      {
        issuer: "untrusted-issuer",
        audience: "sweety-client",
        algorithm: "HS256",
        expiresIn: "1h",
      },
    );

    expect(() => tokenService.verify(foreignToken)).toThrow(/jwt issuer invalid/);
  });

  it("5. Throws error when token has incorrect audience", () => {
    const foreignToken = jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        type: "access",
      },
      secret,
      {
        issuer: "sweety-api",
        audience: "untrusted-audience",
        algorithm: "HS256",
        expiresIn: "1h",
      },
    );

    expect(() => tokenService.verify(foreignToken)).toThrow(/jwt audience invalid/);
  });

  it("6. Throws error when token type is not 'access'", () => {
    const refreshTypeToken = jwt.sign(
      {
        userId: payload.userId,
        email: payload.email,
        type: "refresh",
      },
      secret,
      {
        issuer: "sweety-api",
        audience: "sweety-client",
        algorithm: "HS256",
        expiresIn: "1h",
      },
    );

    expect(() => tokenService.verify(refreshTypeToken)).toThrow(
      "Invalid token type: expected access token",
    );
  });

  it("7. Throws error on expired token", () => {
    const expiredService = new JwtTokenService({
      secret,
      expiresIn: "1ms",
      issuer: "sweety-api",
      audience: "sweety-client",
    });

    const token = expiredService.generate(payload);

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(() => expiredService.verify(token)).toThrow();
        resolve();
      }, 50);
    });
  });
});
