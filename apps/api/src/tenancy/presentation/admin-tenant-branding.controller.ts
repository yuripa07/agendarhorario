import {
  type TenantBranding,
  type UpdateTenantBrandingInput,
  updateTenantBrandingSchema,
} from "@agendarhorario/shared";
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Patch,
} from "@nestjs/common";
import { ZodValidationPipe } from "../../presentation/pipes/zod-validation.pipe.js";
import {
  TenantBrandingNotFoundError,
  TenantBrandingUseCases,
} from "../application/tenant-branding.use-cases.js";
import { TenantContextService } from "../application/tenant-context.service.js";

@Controller("admin/tenant/branding")
export class AdminTenantBrandingController {
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

  @Patch()
  update(
    @Body(new ZodValidationPipe(updateTenantBrandingSchema)) input: UpdateTenantBrandingInput,
  ): Promise<TenantBranding> {
    return this.mapNotFound(() => this.tenantBranding.update(this.requireTenantId(), input));
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
