import {
  type CreateServiceInput,
  createServiceSchema,
  type Service,
  serviceIdSchema,
  type UpdateServiceInput,
  updateServiceSchema,
} from "@agendarhorario/shared";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ZodValidationPipe } from "../../presentation/pipes/zod-validation.pipe.js";
import { TenantContextService } from "../../tenancy/application/tenant-context.service.js";
import { AdminTenantMembershipGuard } from "../../tenancy/presentation/admin-tenant-membership.guard.js";
import { ServiceCatalogUseCases } from "../application/service-catalog.use-cases.js";
import { ServiceNotFoundError } from "../domain/service.errors.js";
import { ADMIN_SERVICES_ROUTE } from "../services.constants.js";

@Controller(ADMIN_SERVICES_ROUTE)
@UseGuards(AdminTenantMembershipGuard)
export class AdminServicesController {
  constructor(
    @Inject(TenantContextService)
    private readonly tenantContext: TenantContextService,

    @Inject(ServiceCatalogUseCases)
    private readonly serviceCatalog: ServiceCatalogUseCases,
  ) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(createServiceSchema)) input: CreateServiceInput,
  ): Promise<Service> {
    return this.serviceCatalog.create(this.requireTenantId(), input);
  }

  @Get()
  list(): Promise<readonly Service[]> {
    return this.serviceCatalog.list(this.requireTenantId());
  }

  @Get(":id")
  async get(
    @Param("id", new ZodValidationPipe(serviceIdSchema)) serviceId: string,
  ): Promise<Service> {
    return this.mapNotFound(() => this.serviceCatalog.get(this.requireTenantId(), serviceId));
  }

  @Patch(":id")
  async update(
    @Param("id", new ZodValidationPipe(serviceIdSchema)) serviceId: string,
    @Body(new ZodValidationPipe(updateServiceSchema)) input: UpdateServiceInput,
  ): Promise<Service> {
    return this.mapNotFound(() =>
      this.serviceCatalog.update(this.requireTenantId(), serviceId, input),
    );
  }

  @Delete(":id")
  async deactivate(
    @Param("id", new ZodValidationPipe(serviceIdSchema)) serviceId: string,
  ): Promise<Service> {
    return this.mapNotFound(() =>
      this.serviceCatalog.deactivate(this.requireTenantId(), serviceId),
    );
  }

  private requireTenantId(): string {
    const context = this.tenantContext.getContext();

    if (!context) {
      throw new BadRequestException("Tenant context is required");
    }

    return context.tenantId;
  }

  private async mapNotFound(operation: () => Promise<Service>): Promise<Service> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof ServiceNotFoundError) {
        throw new NotFoundException("Service not found");
      }

      throw error;
    }
  }
}
