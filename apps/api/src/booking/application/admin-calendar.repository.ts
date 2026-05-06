import type { AdminCalendarAppointment, PublicService } from "@agendarhorario/shared";
import type { SmartSlotInterval, SmartSlotWorkingHour } from "../../scheduling/domain/index.js";

export const ADMIN_CALENDAR_REPOSITORY = Symbol("ADMIN_CALENDAR_REPOSITORY");

export interface AdminCalendarRepository {
  findActiveService(tenantId: string, serviceId: string): Promise<PublicService | undefined>;
  findShortestActiveServiceDurationMinutes(tenantId: string): Promise<number | undefined>;
  listWorkingHours(tenantId: string): Promise<readonly SmartSlotWorkingHour[]>;
  listBlocks(tenantId: string, startsAt: Date, endsAt: Date): Promise<readonly SmartSlotInterval[]>;
  listActiveAppointments(
    tenantId: string,
    startsAt: Date,
    endsAt: Date,
    excludeAppointmentId?: string,
  ): Promise<readonly SmartSlotInterval[]>;
  listAppointments(
    tenantId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<readonly AdminCalendarAppointment[]>;
  findAppointment(
    tenantId: string,
    appointmentId: string,
  ): Promise<AdminCalendarAppointment | undefined>;
  createConfirmed(input: {
    tenantId: string;
    serviceId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    startsAt: Date;
    endsAt: Date;
    managementTokenHash: string;
    managementTokenExpiresAt: Date;
  }): Promise<AdminCalendarAppointment>;
  rescheduleAppointment(
    tenantId: string,
    appointmentId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<AdminCalendarAppointment | undefined>;
  cancelAppointment(
    tenantId: string,
    appointmentId: string,
  ): Promise<AdminCalendarAppointment | undefined>;
}
