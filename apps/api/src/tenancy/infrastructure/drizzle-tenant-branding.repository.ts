import type { TenantBranding, UpdateTenantBrandingInput } from "@agendarhorario/shared";
import { eq, sql } from "drizzle-orm";
import type { Database } from "../../infrastructure/database/database.module.js";
import { type TenantRecord, tenants } from "../../infrastructure/database/schema.js";
import type { TenantBrandingRepository } from "../application/tenant-branding.repository.js";

export class DrizzleTenantBrandingRepository implements TenantBrandingRepository {
  constructor(private readonly database: Database) {}

  async findBrandingByTenantId(tenantId: string): Promise<TenantBranding | undefined> {
    const tenant = await this.database.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    return tenant ? mapTenantBrandingRecord(tenant) : undefined;
  }

  async updateBrandingByTenantId(
    tenantId: string,
    input: UpdateTenantBrandingInput,
  ): Promise<TenantBranding | undefined> {
    const [tenant] = await this.database
      .update(tenants)
      .set({
        displayName: input.displayName,
        primaryColor: input.primaryColor,
        updatedAt: sql`now()`,
      })
      .where(eq(tenants.id, tenantId))
      .returning();

    return tenant ? mapTenantBrandingRecord(tenant) : undefined;
  }
}

function mapTenantBrandingRecord(record: TenantRecord): TenantBranding {
  return {
    displayName: record.displayName,
    primaryColor: record.primaryColor,
  };
}
