import type { AdminCalendarAppointment, AdminCalendarQuery } from "@agendarhorario/shared";
import type { TenantContext } from "../../tenancy/domain/tenant-context.js";
import type { AdminCalendarRepository } from "./admin-calendar.repository.js";

type AdminCalendarTenant = Pick<TenantContext, "tenantId">;

export class AdminCalendarUseCases {
  constructor(private readonly repository: AdminCalendarRepository) {}

  async listAppointments(
    context: AdminCalendarTenant | undefined,
    query: AdminCalendarQuery,
  ): Promise<readonly AdminCalendarAppointment[]> {
    if (!context) {
      throw new AdminCalendarTenantRequiredError();
    }

    return this.repository.listAppointments(context.tenantId, query.startsAt, query.endsAt);
  }
}

export class AdminCalendarTenantRequiredError extends Error {
  constructor() {
    super("Tenant context is required");
    this.name = "AdminCalendarTenantRequiredError";
  }
}
