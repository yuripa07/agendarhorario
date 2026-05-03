import { eq } from "drizzle-orm";
import type { Database } from "../../infrastructure/database/database.module.js";
import { type TenantRecord, tenants } from "../../infrastructure/database/schema.js";

export type TenantLookup = {
  findBySlug(slug: string): Promise<TenantRecord | undefined>;
};

export class TenantRepository {
  constructor(private readonly database: Database) {}

  async findBySlug(slug: string): Promise<TenantRecord | undefined> {
    return this.database.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
    });
  }
}
