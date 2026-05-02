import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { envSchema } from "../config/env.schema.js";
import { tenants } from "./schema.js";

async function seed(): Promise<void> {
  const env = envSchema.parse(process.env);
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool);

  await db
    .insert(tenants)
    .values({
      slug: "default",
      displayName: "Agendar Horario",
      timezone: "America/Sao_Paulo",
      primaryColor: "#2563eb",
    })
    .onConflictDoNothing({ target: tenants.slug });

  await pool.end();
}

seed().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
