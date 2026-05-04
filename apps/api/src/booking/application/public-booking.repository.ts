import type { PublicAppointment, PublicService } from "@agendarhorario/shared";
import type { SmartSlotInterval, SmartSlotWorkingHour } from "../../scheduling/domain/index.js";

export const PUBLIC_BOOKING_REPOSITORY = Symbol("PUBLIC_BOOKING_REPOSITORY");

export type CreateConfirmedAppointmentInput = {
  tenantId: string;
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startsAt: Date;
  endsAt: Date;
  managementTokenHash: string;
  managementTokenExpiresAt: Date;
};

export interface PublicBookingRepository {
  listActiveServices(tenantId: string): Promise<readonly PublicService[]>;
  findActiveService(tenantId: string, serviceId: string): Promise<PublicService | undefined>;
  findShortestActiveServiceDurationMinutes(tenantId: string): Promise<number | undefined>;
  listWorkingHours(tenantId: string): Promise<readonly SmartSlotWorkingHour[]>;
  listBlocks(tenantId: string, startsAt: Date, endsAt: Date): Promise<readonly SmartSlotInterval[]>;
  listActiveAppointments(
    tenantId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<readonly SmartSlotInterval[]>;
  createConfirmed(input: CreateConfirmedAppointmentInput): Promise<PublicAppointment>;
  findByManagementTokenHash(tokenHash: string): Promise<PublicAppointment | undefined>;
  cancelByManagementTokenHash(tokenHash: string): Promise<PublicAppointment | undefined>;
}
