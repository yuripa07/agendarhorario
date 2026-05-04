import type { PublicAppointment, PublicService, WorkingHour } from "@agendarhorario/shared";
import { and, asc, eq, gt, lt, min, sql } from "drizzle-orm";
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
import type {
  CreateConfirmedAppointmentInput,
  PublicBookingRepository,
} from "../application/public-booking.repository.js";

export class DrizzlePublicBookingRepository implements PublicBookingRepository {
  constructor(private readonly database: Database) {}

  async listActiveServices(tenantId: string): Promise<readonly PublicService[]> {
    const records = await this.database.query.services.findMany({
      where: and(eq(services.tenantId, tenantId), eq(services.isActive, true)),
      orderBy: [asc(services.name)],
    });

    return records.map(mapServiceRecord);
  }

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
  ): Promise<readonly SmartSlotInterval[]> {
    const records = await this.database.query.appointments.findMany({
      where: and(
        eq(appointments.tenantId, tenantId),
        eq(appointments.status, "confirmed"),
        lt(appointments.startsAt, endsAt),
        gt(appointments.endsAt, startsAt),
      ),
      orderBy: [asc(appointments.startsAt)],
    });

    return records.map((record) => ({
      startsAt: record.startsAt,
      endsAt: record.endsAt,
    }));
  }

  async createConfirmed(input: CreateConfirmedAppointmentInput): Promise<PublicAppointment> {
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
      .returning();

    return mapAppointmentRecord(requireAppointmentRecord(appointment));
  }

  async findByManagementTokenHash(tokenHash: string): Promise<PublicAppointment | undefined> {
    const appointment = await this.database.query.appointments.findFirst({
      where: eq(appointments.managementTokenHash, tokenHash),
    });

    return appointment ? mapAppointmentRecord(appointment) : undefined;
  }

  async cancelByManagementTokenHash(tokenHash: string): Promise<PublicAppointment | undefined> {
    const [appointment] = await this.database
      .update(appointments)
      .set({
        status: "canceled",
        canceledAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(
        and(eq(appointments.managementTokenHash, tokenHash), eq(appointments.status, "confirmed")),
      )
      .returning();

    return appointment ? mapAppointmentRecord(appointment) : undefined;
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

function mapAppointmentRecord(record: AppointmentRecord): PublicAppointment {
  return {
    id: record.id,
    tenantId: record.tenantId,
    serviceId: record.serviceId,
    customerName: record.customerName,
    customerEmail: record.customerEmail,
    customerPhone: record.customerPhone,
    startsAt: record.startsAt,
    endsAt: record.endsAt,
    status: record.status === "canceled" ? "canceled" : "confirmed",
    managementTokenExpiresAt: record.managementTokenExpiresAt,
    canceledAt: record.canceledAt,
  };
}

function requireAppointmentRecord(record: AppointmentRecord | undefined): AppointmentRecord {
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
