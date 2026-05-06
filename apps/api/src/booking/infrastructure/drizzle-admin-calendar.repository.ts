import type { AdminCalendarAppointment, PublicService, WorkingHour } from "@agendarhorario/shared";
import { and, asc, eq, gt, lt, min, ne, sql } from "drizzle-orm";
import type { Database } from "../../infrastructure/database/database.module.js";
import {
  type AppointmentRecord,
  appointments,
  availabilityBlocks,
  type ServiceRecord,
  services,
  type WorkingHourRecord,
  workingHours,
} from "../../infrastructure/database/schema.js";
import type { SmartSlotInterval } from "../../scheduling/domain/index.js";
import type { AdminCalendarRepository } from "../application/admin-calendar.repository.js";

type CalendarAppointmentRecord = {
  appointment: AppointmentRecord;
  service: ServiceRecord;
};

export class DrizzleAdminCalendarRepository implements AdminCalendarRepository {
  constructor(private readonly database: Database) {}

  async findActiveService(tenantId: string, serviceId: string): Promise<PublicService | undefined> {
    const service = await this.database.query.services.findFirst({
      where: and(
        eq(services.tenantId, tenantId),
        eq(services.id, serviceId),
        eq(services.isActive, true),
      ),
    });

    return service ? mapServiceRecord(service) : undefined;
  }

  async findShortestActiveServiceDurationMinutes(tenantId: string): Promise<number | undefined> {
    const [result] = await this.database
      .select({ durationMinutes: min(services.durationMinutes) })
      .from(services)
      .where(and(eq(services.tenantId, tenantId), eq(services.isActive, true)));

    return result?.durationMinutes ? Number(result.durationMinutes) : undefined;
  }

  async listWorkingHours(tenantId: string): Promise<readonly WorkingHour[]> {
    const records = await this.database.query.workingHours.findMany({
      where: and(eq(workingHours.tenantId, tenantId), eq(workingHours.isActive, true)),
      orderBy: [asc(workingHours.weekday), asc(workingHours.startMinutes)],
    });

    return records.map(mapWorkingHourRecord);
  }

  async listBlocks(
    tenantId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<readonly SmartSlotInterval[]> {
    const records = await this.database.query.availabilityBlocks.findMany({
      where: and(
        eq(availabilityBlocks.tenantId, tenantId),
        lt(availabilityBlocks.startsAt, endsAt),
        gt(availabilityBlocks.endsAt, startsAt),
      ),
      orderBy: [asc(availabilityBlocks.startsAt)],
    });

    return records.map((record) => ({
      startsAt: record.startsAt,
      endsAt: record.endsAt,
    }));
  }

  async listActiveAppointments(
    tenantId: string,
    startsAt: Date,
    endsAt: Date,
    excludeAppointmentId?: string,
  ): Promise<readonly SmartSlotInterval[]> {
    const records = await this.database.query.appointments.findMany({
      where: and(
        eq(appointments.tenantId, tenantId),
        eq(appointments.status, "confirmed"),
        lt(appointments.startsAt, endsAt),
        gt(appointments.endsAt, startsAt),
        excludeAppointmentId ? ne(appointments.id, excludeAppointmentId) : undefined,
      ),
      orderBy: [asc(appointments.startsAt)],
    });

    return records.map((record) => ({
      startsAt: record.startsAt,
      endsAt: record.endsAt,
    }));
  }

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

  async findAppointment(
    tenantId: string,
    appointmentId: string,
  ): Promise<AdminCalendarAppointment | undefined> {
    const [record] = await this.database
      .select({
        appointment: appointments,
        service: services,
      })
      .from(appointments)
      .innerJoin(services, eq(services.id, appointments.serviceId))
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          eq(appointments.id, appointmentId),
          eq(services.tenantId, tenantId),
        ),
      )
      .limit(1);

    return record ? mapCalendarAppointmentRecord(record) : undefined;
  }

  async createConfirmed(
    input: Parameters<AdminCalendarRepository["createConfirmed"]>[0],
  ): Promise<AdminCalendarAppointment> {
    const [appointment] = await this.database
      .insert(appointments)
      .values({
        tenantId: input.tenantId,
        serviceId: input.serviceId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        status: "confirmed",
        managementTokenHash: input.managementTokenHash,
        managementTokenExpiresAt: input.managementTokenExpiresAt,
      })
      .returning({ id: appointments.id });

    return this.requireAppointment(input.tenantId, requireInsertedAppointment(appointment).id);
  }

  async rescheduleAppointment(
    tenantId: string,
    appointmentId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<AdminCalendarAppointment | undefined> {
    const [appointment] = await this.database
      .update(appointments)
      .set({
        startsAt,
        endsAt,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          eq(appointments.id, appointmentId),
          eq(appointments.status, "confirmed"),
        ),
      )
      .returning({ id: appointments.id });

    return appointment ? this.requireAppointment(tenantId, appointment.id) : undefined;
  }

  async cancelAppointment(
    tenantId: string,
    appointmentId: string,
  ): Promise<AdminCalendarAppointment | undefined> {
    const [appointment] = await this.database
      .update(appointments)
      .set({
        status: "canceled",
        canceledAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(appointments.tenantId, tenantId),
          eq(appointments.id, appointmentId),
          eq(appointments.status, "confirmed"),
        ),
      )
      .returning({ id: appointments.id });

    return appointment ? this.requireAppointment(tenantId, appointment.id) : undefined;
  }

  private async requireAppointment(
    tenantId: string,
    appointmentId: string,
  ): Promise<AdminCalendarAppointment> {
    const appointment = await this.findAppointment(tenantId, appointmentId);

    if (!appointment) {
      throw new AppointmentPersistenceError();
    }

    return appointment;
  }
}

function mapServiceRecord(record: ServiceRecord): PublicService {
  return {
    id: record.id,
    tenantId: record.tenantId,
    name: record.name,
    durationMinutes: record.durationMinutes,
    priceCents: record.priceCents,
    isActive: record.isActive,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapWorkingHourRecord(record: WorkingHourRecord): WorkingHour {
  return {
    id: record.id,
    tenantId: record.tenantId,
    weekday: record.weekday,
    startMinutes: record.startMinutes,
    endMinutes: record.endMinutes,
    isActive: record.isActive,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
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

function requireInsertedAppointment(record: { id: string } | undefined): { id: string } {
  if (!record) {
    throw new AppointmentPersistenceError();
  }

  return record;
}

class AppointmentPersistenceError extends Error {
  constructor() {
    super("Appointment persistence failed");
    this.name = "AppointmentPersistenceError";
  }
}
