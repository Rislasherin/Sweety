import dotenv from "dotenv";
dotenv.config();

import { z } from "zod";

const envSchema = z
  .object({
    PORT: z
      .string()
      .default("3000")
      .transform((val) => parseInt(val, 10)),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    JWT_SECRET: z
      .string()
      .min(16, "JWT_SECRET must be at least 16 characters")
      .default("sweety_default_jwt_secret_at_least_32_characters_long"),
    JWT_EXPIRES_IN: z.string().default("15m"),
    JWT_EXPIRATION: z.string().optional(),
    JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
    JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
    JWT_ISSUER: z.string().default("sweety-api"),
    JWT_AUDIENCE: z.string().default("sweety-client"),
    CORS_ORIGIN: z.string().optional(),
    LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  })
  .superRefine((data, ctx) => {
    // In production, an explicitly configured trusted origin list is strictly mandatory
    if (
      data.NODE_ENV === "production" &&
      (!data.CORS_ORIGIN || data.CORS_ORIGIN.trim().length === 0)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CORS_ORIGIN must be explicitly configured in production environment",
        path: ["CORS_ORIGIN"],
      });
    }

    // Wildcards cannot be used with credentials
    if (
      data.CORS_ORIGIN &&
      data.CORS_ORIGIN.split(",")
        .map((s) => s.trim())
        .includes("*")
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Wildcard origin '*' is not permitted when credentials are enabled",
        path: ["CORS_ORIGIN"],
      });
    }
  });

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  CORS_ORIGIN:
    parsed.CORS_ORIGIN ??
    (parsed.NODE_ENV === "production"
      ? ""
      : "http://localhost:3001,http://127.0.0.1:3001,http://localhost:5173,http://127.0.0.1:5173"),
  JWT_EXPIRES_IN: parsed.JWT_EXPIRATION ?? parsed.JWT_EXPIRES_IN,
};

export type EnvConfig = typeof env;
