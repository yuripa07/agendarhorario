import {
  type AvailabilityBlock,
  availabilityBlockIdSchema,
  type CreateAvailabilityBlockInput,
  createAvailabilityBlockSchema,
  type ReplaceWorkingHoursInput,
  replaceWorkingHoursSchema,
  type WorkingHour,
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
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { ZodValidationPipe } from "../../presentation/pipes/zod-validation.pipe.js";
import { TenantContextService } from "../../tenancy/application/tenant-context.service.js";
import { AdminTenantMembershipGuard } from "../../tenancy/presentation/admin-tenant-membership.guard.js";
import { AvailabilityUseCases } from "../application/availability.use-cases.js";
import { ADMIN_AVAILABILITY_ROUTE } from "../availability.constants.js";
import { AvailabilityBlockNotFoundError } from "../domain/availability.errors.js";

@Controller(ADMIN_AVAILABILITY_ROUTE)
@UseGuards(AdminTenantMembershipGuard)
export class AdminAvailabilityController {
  constructor(
    @Inject(TenantContextService)
    private readonly tenantContext: TenantContextService,

    @Inject(AvailabilityUseCases)
    private readonly availability: AvailabilityUseCases,
  ) {}

  @Get("working-hours")
  listWorkingHours(): Promise<readonly WorkingHour[]> {
    return this.availability.listWorkingHours(this.requireTenantId());
  }

  @Put("working-hours")
  replaceWorkingHours(
    @Body(new ZodValidationPipe(replaceWorkingHoursSchema)) input: ReplaceWorkingHoursInput,
  ): Promise<readonly WorkingHour[]> {
    return this.availability.replaceWorkingHours(this.requireTenantId(), input.workingHours);
  }

  @Get("blocks")
  listBlocks(): Promise<readonly AvailabilityBlock[]> {
    return this.availability.listBlocks(this.requireTenantId());
  }

  @Post("blocks")
  createBlock(
    @Body(new ZodValidationPipe(createAvailabilityBlockSchema)) input: CreateAvailabilityBlockInput,
  ): Promise<AvailabilityBlock> {
    return this.availability.createBlock(this.requireTenantId(), input);
  }

  @Delete("blocks/:id")
  async deleteBlock(
    @Param("id", new ZodValidationPipe(availabilityBlockIdSchema)) blockId: string,
  ): Promise<AvailabilityBlock> {
    try {
      return await this.availability.deleteBlock(this.requireTenantId(), blockId);
    } catch (error) {
      if (error instanceof AvailabilityBlockNotFoundError) {
        throw new NotFoundException("Availability block not found");
      }

      throw error;
    }
  }

  private requireTenantId(): string {
    const context = this.tenantContext.getContext();

    if (!context) {
      throw new BadRequestException("Tenant context is required");
    }

    return context.tenantId;
  }
}
