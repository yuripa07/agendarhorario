import {
  type AdminCalendarAppointment,
  type AdminCalendarQuery,
  adminCalendarQuerySchema,
} from "@agendarhorario/shared";
import { BadRequestException, Controller, Get, Inject, Query } from "@nestjs/common";
import { ZodValidationPipe } from "../../presentation/pipes/zod-validation.pipe.js";
import { TenantContextService } from "../../tenancy/application/tenant-context.service.js";
import { AdminCalendarUseCases } from "../application/admin-calendar.use-cases.js";
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

  private currentTenant() {
    const context = this.tenantContext.getContext();

    if (!context) {
      throw new BadRequestException("Tenant context is required");
    }

    return context;
  }
}
