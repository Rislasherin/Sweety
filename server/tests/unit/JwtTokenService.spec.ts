import { describe, it, expect } from "vitest";
import { JwtTokenService } from "@infrastructure/services/JwtTokenService";

describe("JwtTokenService Unit Tests", () => {
  const secret = "test-secret-key-1234567890-secure";
  const tokenService = new JwtTokenService({
    secret,
    expiresIn: "1h",
  });

  const payload = {
    userId: "uuid-test-123",
    email: "user@example.com",
  };

  it("1. Generates a signed JWT string", () => {
    const token = tokenService.generate(payload);

    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // JWT format: header.payload.signature
  });

  it("2. Verifies and extracts payload from a valid token", () => {
    const token = tokenService.generate(payload);
    const decoded = tokenService.verify(token);

    expect(decoded).toEqual({
      userId: "uuid-test-123",
      email: "user@example.com",
    });
  });

  it("3. Throws error on invalid or tampered token", () => {
    const token = tokenService.generate(payload);
    const tampered = token + "corrupted";

    expect(() => tokenService.verify(tampered)).toThrow();
  });

  it("4. Throws error on expired token", () => {
    const expiredService = new JwtTokenService({
      secret,
      expiresIn: "1ms", // expires almost instantly
    });

    const token = expiredService.generate(payload);

    // Wait a tiny bit to guarantee expiration
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(() => expiredService.verify(token)).toThrow();
        resolve();
      }, 50);
    });
  });
});
