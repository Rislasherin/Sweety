import pino, { type Logger, type LoggerOptions } from "pino";
import { env } from "@main/config/env";

export const REDACTED_KEYS = [
  "password",
  "passwordHash",
  "*.password",
  "*.passwordHash",
  "token",
  "accessToken",
  "refreshToken",
  "*.token",
  "*.accessToken",
  "*.refreshToken",
  "authorization",
  "headers.authorization",
  "req.headers.authorization",
  "cookie",
  "headers.cookie",
  "req.headers.cookie",
  "databaseUrl",
  "DATABASE_URL",
];

export function createLoggerConfig(
  environment = env.NODE_ENV,
  logLevel = env.LOG_LEVEL,
): LoggerOptions {
  const isDev = environment === "development";
  const isTest = environment === "test";

  const options: LoggerOptions = {
    level: isTest ? process.env.LOG_LEVEL || "silent" : logLevel,
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: REDACTED_KEYS,
      censor: "[REDACTED]",
    },
    base: isTest
      ? undefined
      : {
          env: environment,
        },
  };

  if (isDev) {
    options.transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:yyyy-mm-dd HH:MM:ss.l",
        ignore: "pid,hostname",
      },
    };
  }

  return options;
}

export const logger: Logger = pino(createLoggerConfig());
