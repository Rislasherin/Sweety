import { describe, it, expect } from "vitest";
import pino from "pino";
import { createLoggerConfig, REDACTED_KEYS } from "@infrastructure/logging/logger";

describe("Pino Logger Configuration & Redaction Unit Tests", () => {
  it("1. Configures structured JSON logging for production environment", () => {
    const config = createLoggerConfig("production", "info");

    expect(config.base).toEqual({ env: "production" });
    expect(config.transport).toBeUndefined();
    expect(config.level).toBe("info");
    expect(config.redact).toBeDefined();
  });

  it("2. Configures pino-pretty transport for development environment", () => {
    const config = createLoggerConfig("development", "debug");

    expect(config.base).toEqual({ env: "development" });
    expect(config.transport).toBeDefined();
    expect(config.transport?.target).toBe("pino-pretty");
    expect(config.level).toBe("debug");
  });

  it("3. Contains comprehensive redaction keys for sensitive credentials", () => {
    expect(REDACTED_KEYS).toContain("password");
    expect(REDACTED_KEYS).toContain("passwordHash");
    expect(REDACTED_KEYS).toContain("token");
    expect(REDACTED_KEYS).toContain("accessToken");
    expect(REDACTED_KEYS).toContain("refreshToken");
    expect(REDACTED_KEYS).toContain("authorization");
    expect(REDACTED_KEYS).toContain("cookie");
    expect(REDACTED_KEYS).toContain("DATABASE_URL");
  });

  it("4. Automatically redacts passwords, tokens, and authorization headers from log streams", () => {
    const logs: string[] = [];

    // Custom stream capturing destination output
    const testStream = {
      write: (msg: string) => {
        logs.push(msg);
      },
    };

    const testLogger = pino(
      {
        level: "info",
        redact: {
          paths: REDACTED_KEYS,
          censor: "[REDACTED]",
        },
      },
      testStream,
    );

    testLogger.info({
      event: "user_login_attempt",
      email: "user@example.com",
      password: "SuperSecretPassword123!",
      passwordHash: "$2b$12$e82b7194872149817294",
      token: "secret.jwt.token.string",
      authorization: "Bearer secret-bearer-token",
      cookie: "session_id=123456",
    });

    expect(logs.length).toBe(1);
    const logOutput = logs[0];

    // Assert that sensitive values are NEVER present
    expect(logOutput).not.toContain("SuperSecretPassword123!");
    expect(logOutput).not.toContain("$2b$12$e82b7194872149817294");
    expect(logOutput).not.toContain("secret.jwt.token.string");
    expect(logOutput).not.toContain("secret-bearer-token");
    expect(logOutput).not.toContain("session_id=123456");

    // Assert that [REDACTED] appears in the output
    expect(logOutput).toContain("[REDACTED]");
    expect(logOutput).toContain("user@example.com");
  });
});
