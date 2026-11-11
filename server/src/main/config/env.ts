import dotenv from "dotenv";
dotenv.config();

import { z } from "zod";

const envSchema = z.object({
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
  JWT_EXPIRES_IN: z.string().default("1d"),
  JWT_EXPIRATION: z.string().optional(),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
});

const parsed = envSchema.parse(process.env);

export const env = {
  ...parsed,
  JWT_EXPIRES_IN: parsed.JWT_EXPIRATION ?? parsed.JWT_EXPIRES_IN,
};

export type EnvConfig = typeof env;
