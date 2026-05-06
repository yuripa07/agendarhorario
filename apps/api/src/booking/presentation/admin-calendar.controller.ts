import {
  type AdminCalendarAppointment,
  type AdminCalendarQuery,
  type AdminCalendarSlot,
  adminCalendarQuerySchema,
  appointmentIdSchema,
  type CreateAdminAppointmentInput,
  createAdminAppointmentSchema,
  type RescheduleAdminAppointmentInput,
  rescheduleAdminAppointmentSchema,
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
import { ZodValidationPipe } from "../../presentation/pipes/zod-validation.pipe.js";
import { TenantContextService } from "../../tenancy/application/tenant-context.service.js";
import {
  AdminCalendarAppointmentCanceledError,
  AdminCalendarAppointmentNotFoundError,
  AdminCalendarConflictError,
  AdminCalendarInvalidSlotError,
  AdminCalendarServiceNotFoundError,
  AdminCalendarUseCases,
} from "../application/admin-calendar.use-cases.js";
import { ADMIN_CALENDAR_ROUTE } from "../booking.constants.js";

@Controller(ADMIN_CALENDAR_ROUTE)
export class AdminCalendarController {
  constructor(
    @Inject(TenantContextService)
    private readonly tenantContext: TenantContextService,

    @Inject(AdminCalendarUseCases)
    private readonly calendar: AdminCalendarUseCases,
  ) {}

  @Get("appointments")
  listAppointments(
    @Query(new ZodValidationPipe(adminCalendarQuerySchema)) query: AdminCalendarQuery,
  ): Promise<readonly AdminCalendarAppointment[]> {
    return this.calendar.listAppointments(this.currentTenant(), query);
  }

  @Get("services/:serviceId/slots")
  listSlots(
    @Param("serviceId", new ZodValidationPipe(serviceIdSchema)) serviceId: string,
    @Query(new ZodValidationPipe(adminCalendarQuerySchema)) query: AdminCalendarQuery,
  ): Promise<readonly AdminCalendarSlot[]> {
    return this.mapErrors(() => this.calendar.listSlots(this.currentTenant(), serviceId, query));
  }

  @Post("appointments")
  createAppointment(
    @Body(new ZodValidationPipe(createAdminAppointmentSchema)) input: CreateAdminAppointmentInput,
  ): Promise<AdminCalendarAppointment> {
    return this.mapErrors(() => this.calendar.createAppointment(this.currentTenant(), input));
  }

  @Post("appointments/:id/reschedule")
  @HttpCode(200)
  rescheduleAppointment(
    @Param("id", new ZodValidationPipe(appointmentIdSchema)) appointmentId: string,
    @Body(new ZodValidationPipe(rescheduleAdminAppointmentSchema))
    input: RescheduleAdminAppointmentInput,
  ): Promise<AdminCalendarAppointment> {
    return this.mapErrors(() =>
      this.calendar.rescheduleAppointment(this.currentTenant(), appointmentId, input),
    );
  }

  @Post("appointments/:id/cancel")
  @HttpCode(200)
  cancelAppointment(
    @Param("id", new ZodValidationPipe(appointmentIdSchema)) appointmentId: string,
  ): Promise<AdminCalendarAppointment> {
    return this.mapErrors(() =>
      this.calendar.cancelAppointment(this.currentTenant(), appointmentId),
    );
  }

  private currentTenant() {
    const context = this.tenantContext.getContext();

    if (!context) {
      throw new BadRequestException("Tenant context is required");
    }

    return context;
  }

  private async mapErrors<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof AdminCalendarServiceNotFoundError) {
        throw new NotFoundException("Service not found");
      }

      if (error instanceof AdminCalendarAppointmentNotFoundError) {
        throw new NotFoundException("Appointment not found");
      }

      if (error instanceof AdminCalendarInvalidSlotError) {
        throw new BadRequestException("Requested slot is not available");
      }

      if (error instanceof AdminCalendarConflictError) {
        throw new ConflictException("Appointment slot is no longer available");
      }

      if (error instanceof AdminCalendarAppointmentCanceledError) {
        throw new BadRequestException("Appointment is canceled");
      }

      throw error;
    }
  }
}
