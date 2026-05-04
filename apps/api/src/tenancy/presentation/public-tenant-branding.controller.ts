import type { TenantBranding } from "@agendarhorario/shared";
import { BadRequestException, Controller, Get, Inject, NotFoundException } from "@nestjs/common";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import {
  TenantBrandingNotFoundError,
  TenantBrandingUseCases,
} from "../application/tenant-branding.use-cases.js";
import { TenantContextService } from "../application/tenant-context.service.js";

@AllowAnonymous()
@Controller("public/tenant/branding")
export class PublicTenantBrandingController {
  constructor(
    @Inject(TenantContextService)
    private readonly tenantContext: TenantContextService,

    @Inject(TenantBrandingUseCases)
    private readonly tenantBranding: TenantBrandingUseCases,
  ) {}

  @Get()
  get(): Promise<TenantBranding> {
    return this.mapNotFound(() => this.tenantBranding.get(this.requireTenantId()));
  }

  private requireTenantId(): string {
    const context = this.tenantContext.getContext();

    if (!context) {
      throw new BadRequestException("Tenant context is required");
    }

    return context.tenantId;
  }

  private async mapNotFound(operation: () => Promise<TenantBranding>): Promise<TenantBranding> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof TenantBrandingNotFoundError) {
        throw new NotFoundException("Tenant branding not found");
      }

      throw error;
    }
  }
}
