import type { AdminCalendarAppointment } from "@agendarhorario/shared";

export const ADMIN_CALENDAR_REPOSITORY = Symbol("ADMIN_CALENDAR_REPOSITORY");

export interface AdminCalendarRepository {
  listAppointments(
    tenantId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<readonly AdminCalendarAppointment[]>;
}
