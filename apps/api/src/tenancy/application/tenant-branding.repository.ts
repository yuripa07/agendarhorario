import type { TenantBranding, UpdateTenantBrandingInput } from "@agendarhorario/shared";

export const TENANT_BRANDING_REPOSITORY = Symbol("TENANT_BRANDING_REPOSITORY");

export interface TenantBrandingRepository {
  findBrandingByTenantId(tenantId: string): Promise<TenantBranding | undefined>;
  updateBrandingByTenantId(
    tenantId: string,
    input: UpdateTenantBrandingInput,
  ): Promise<TenantBranding | undefined>;
}
