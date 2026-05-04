import type { TenantBranding, UpdateTenantBrandingInput } from "@agendarhorario/shared";
import type { TenantBrandingRepository } from "./tenant-branding.repository.js";

export class TenantBrandingUseCases {
  constructor(private readonly repository: TenantBrandingRepository) {}

  async get(tenantId: string): Promise<TenantBranding> {
    const branding = await this.repository.findBrandingByTenantId(tenantId);

    if (!branding) {
      throw new TenantBrandingNotFoundError();
    }

    return branding;
  }

  async update(tenantId: string, input: UpdateTenantBrandingInput): Promise<TenantBranding> {
    const branding = await this.repository.updateBrandingByTenantId(tenantId, input);

    if (!branding) {
      throw new TenantBrandingNotFoundError();
    }

    return branding;
  }
}

export class TenantBrandingNotFoundError extends Error {
  constructor() {
    super("Tenant branding not found");
    this.name = "TenantBrandingNotFoundError";
  }
}
