import { createTenantInviteSchema } from "@agendarhorario/shared";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { z } from "zod";
import { envSchema } from "../../infrastructure/config/env.schema.js";
import * as schema from "../../infrastructure/database/schema.js";
import { TenantOnboardingUseCases } from "../application/tenant-onboarding.use-cases.js";
import { DrizzleTenantOnboardingAuth } from "../infrastructure/drizzle-tenant-onboarding.auth.js";
import { DrizzleTenantOnboardingRepository } from "../infrastructure/drizzle-tenant-onboarding.repository.js";

const argsSchema = createTenantInviteSchema.extend({
  baseUrl: z.string().url().optional(),
});

async function main(): Promise<void> {
  const env = envSchema.parse(process.env);
  const args = argsSchema.parse(parseArgs(process.argv.slice(2)));
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const database = drizzle(pool, { schema });
  const onboarding = new TenantOnboardingUseCases(
    new DrizzleTenantOnboardingRepository(database),
    new DrizzleTenantOnboardingAuth(database),
  );

  try {
    const invite = await onboarding.createInvite(args);
    const url = buildInviteUrl({
      token: invite.token,
      slug: invite.tenantSlug,
      rootDomain: env.ROOT_DOMAIN,
      webOrigin: args.baseUrl ?? env.WEB_ORIGIN,
    });

    console.log(`Tenant: ${invite.tenantSlug}`);
    console.log(`Admin: ${invite.adminEmail}`);
    console.log(`Expires at: ${invite.expiresAt.toISOString()}`);
    console.log(`Onboarding URL: ${url}`);
  } finally {
    await pool.end();
  }
}

function parseArgs(rawArgs: string[]): Record<string, string> {
  const parsed: Record<string, string> = {};

  for (let index = 0; index < rawArgs.length; index += 2) {
    const key = rawArgs[index];
    const value = rawArgs[index + 1];

    if (!key?.startsWith("--") || !value) {
      throw new Error(`Invalid argument near ${key ?? "<empty>"}`);
    }

    parsed[toCamelCase(key.slice(2))] = value;
  }

  return parsed;
}

function toCamelCase(value: string): string {
  return value.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

function buildInviteUrl(input: {
  token: string;
  slug: string;
  rootDomain: string;
  webOrigin: string;
}): string {
  const origin = new URL(input.webOrigin);

  if (!["localhost", "127.0.0.1"].includes(origin.hostname)) {
    origin.hostname = `${input.slug}.${input.rootDomain}`;
  }

  const url = new URL("/admin/onboarding", origin);
  url.searchParams.set("token", input.token);

  return url.toString();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
