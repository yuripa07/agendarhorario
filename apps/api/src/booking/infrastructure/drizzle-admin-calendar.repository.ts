import type { AdminCalendarAppointment } from "@agendarhorario/shared";
import { and, asc, eq, gt, lt } from "drizzle-orm";
import type { Database } from "../../infrastructure/database/database.module.js";
import {
  type AppointmentRecord,
  appointments,
  type ServiceRecord,
  services,
} from "../../infrastructure/database/schema.js";
import type { AdminCalendarRepository } from "../application/admin-calendar.repository.js";

type CalendarAppointmentRecord = {
  appointment: AppointmentRecord;
  service: ServiceRecord;
};

export class DrizzleAdminCalendarRepository implements AdminCalendarRepository {
  constructor(private readonly database: Database) {}

  async listAppointments(
    tenantId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<readonly AdminCalendarAppointment[]> {
    const records = await this.database
      .select({
        appointment: appointments,
        service: services,
      })
      .from(appointments)
      .innerJoin(services, eq(services.id, appointments.serviceId))
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          eq(services.tenantId, tenantId),
          lt(appointments.startsAt, endsAt),
          gt(appointments.endsAt, startsAt),
        ),
      )
      .orderBy(asc(appointments.startsAt), asc(appointments.createdAt));

    return records.map(mapCalendarAppointmentRecord);
  }
}

function mapCalendarAppointmentRecord(record: CalendarAppointmentRecord): AdminCalendarAppointment {
  return {
    id: record.appointment.id,
    tenantId: record.appointment.tenantId,
    serviceId: record.appointment.serviceId,
    serviceName: record.service.name,
    serviceDurationMinutes: record.service.durationMinutes,
    customerName: record.appointment.customerName,
    customerEmail: record.appointment.customerEmail,
    customerPhone: record.appointment.customerPhone,
    startsAt: record.appointment.startsAt,
    endsAt: record.appointment.endsAt,
    status: record.appointment.status === "canceled" ? "canceled" : "confirmed",
    canceledAt: record.appointment.canceledAt,
  };
}
