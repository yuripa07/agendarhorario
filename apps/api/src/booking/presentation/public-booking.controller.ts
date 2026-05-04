import {
  type CreatePublicBookingInput,
  createPublicBookingSchema,
  type ManagementTokenInput,
  managementTokenSchema,
  type PublicAppointment,
  type PublicService,
  type PublicSlot,
  type PublicSlotsQuery,
  publicSlotsQuerySchema,
  serviceIdSchema,
} from "@agendarhorario/shared";
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
} from "@nestjs/common";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import { ZodValidationPipe } from "../../presentation/pipes/zod-validation.pipe.js";
import { TenantContextService } from "../../tenancy/application/tenant-context.service.js";
import type { TenantContext } from "../../tenancy/domain/tenant-context.js";
import {
  PublicBookingConflictError,
  PublicBookingInvalidSlotError,
  PublicBookingServiceNotFoundError,
  PublicBookingTenantRequiredError,
  PublicBookingTokenExpiredError,
  PublicBookingTokenNotFoundError,
  PublicBookingUseCases,
} from "../application/public-booking.use-cases.js";

@AllowAnonymous()
@Controller("public")
export class PublicBookingController {
  constructor(
    @Inject(TenantContextService)
    private readonly tenantContext: TenantContextService,

    @Inject(PublicBookingUseCases)
    private readonly booking: PublicBookingUseCases,
  ) {}

  @Get("services")
  listServices(): Promise<readonly PublicService[]> {
    return this.mapErrors(() => this.booking.listServices(this.currentTenant()));
  }

  @Get("services/:serviceId/slots")
  listSlots(
    @Param("serviceId", new ZodValidationPipe(serviceIdSchema)) serviceId: string,
    @Query(new ZodValidationPipe(publicSlotsQuerySchema)) query: PublicSlotsQuery,
  ): Promise<readonly PublicSlot[]> {
    return this.mapErrors(() => this.booking.listSlots(this.currentTenant(), serviceId, query));
  }

  @Post("bookings")
  createBooking(
    @Body(new ZodValidationPipe(createPublicBookingSchema)) input: CreatePublicBookingInput,
  ): Promise<PublicAppointment> {
    return this.mapErrors(() => this.booking.createBooking(this.currentTenant(), input));
  }

  @Post("bookings/management/lookup")
  @HttpCode(200)
  lookup(
    @Body(new ZodValidationPipe(managementTokenSchema)) input: ManagementTokenInput,
  ): Promise<PublicAppointment> {
    return this.mapErrors(() => this.booking.lookupByToken(input.token));
  }

  @Post("bookings/management/cancel")
  @HttpCode(200)
  cancel(
    @Body(new ZodValidationPipe(managementTokenSchema)) input: ManagementTokenInput,
  ): Promise<PublicAppointment> {
    return this.mapErrors(() => this.booking.cancelByToken(input.token));
  }

  private currentTenant(): TenantContext | undefined {
    return this.tenantContext.getContext();
  }

  private async mapErrors<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof PublicBookingTenantRequiredError) {
        throw new BadRequestException("Tenant context is required");
      }

      if (error instanceof PublicBookingServiceNotFoundError) {
        throw new NotFoundException("Service not found");
      }

      if (error instanceof PublicBookingInvalidSlotError) {
        throw new BadRequestException("Requested slot is not available");
      }

      if (error instanceof PublicBookingConflictError) {
        throw new ConflictException("Appointment slot is no longer available");
      }

      if (
        error instanceof PublicBookingTokenNotFoundError ||
        error instanceof PublicBookingTokenExpiredError
      ) {
        throw new NotFoundException("Management token not found");
      }

      throw error;
    }
  }
}
