import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  DATABASE_URL: z
    .string()
    .url()
    .default("postgres://agendarhorario:agendarhorario@localhost:5432/agendarhorario"),
  WEB_ORIGIN: z.string().url().default("http://localhost:5173"),
  BETTER_AUTH_SECRET: z.string().min(32).default("development-better-auth-secret-change-me"),
  BETTER_AUTH_URL: z.string().url().default("http://localhost:3000"),
  ROOT_DOMAIN: z.string().min(1).default("agendarhorario.com.br"),
  RESERVED_SUBDOMAINS: z.string().min(1).default("app,www"),
});

export type Env = z.infer<typeof envSchema>;
