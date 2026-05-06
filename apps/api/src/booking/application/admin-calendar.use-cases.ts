import { randomBytes } from "node:crypto";
import type {
  AdminCalendarAppointment,
  AdminCalendarQuery,
  AdminCalendarSlot,
  CreateAdminAppointmentInput,
  RescheduleAdminAppointmentInput,
} from "@agendarhorario/shared";
import { Logger } from "@nestjs/common";
import { addDays } from "date-fns";
import { calculateAvailableSlots } from "../../scheduling/domain/index.js";
import type { TenantContext } from "../../tenancy/domain/tenant-context.js";
import type { AdminCalendarRepository } from "./admin-calendar.repository.js";
import type {
  BookingCreatedNotification,
  BookingNotificationAppointment,
  BookingNotificationSender,
} from "./booking-notification.sender.js";
import { hashManagementToken } from "./public-booking.use-cases.js";

type AdminCalendarTenant = Pick<TenantContext, "tenantId" | "timezone">;
type Clock = () => Date;
type TokenGenerator = () => string;

export class AdminCalendarUseCases {
  private readonly logger = new Logger(AdminCalendarUseCases.name);

  constructor(
    private readonly repository: AdminCalendarRepository,
    private readonly notifications: BookingNotificationSender,
    private readonly clock: Clock = () => new Date(),
    private readonly tokenGenerator: TokenGenerator = () => randomBytes(32).toString("base64url"),
  ) {}

  async listAppointments(
    context: AdminCalendarTenant | undefined,
    query: AdminCalendarQuery,
  ): Promise<readonly AdminCalendarAppointment[]> {
    if (!context) {
      throw new AdminCalendarTenantRequiredError();
    }

    return this.repository.listAppointments(context.tenantId, query.startsAt, query.endsAt);
  }

  async listSlots(
    context: AdminCalendarTenant | undefined,
    serviceId: string,
    query: AdminCalendarQuery,
  ): Promise<readonly AdminCalendarSlot[]> {
    const tenant = this.requireTenant(context);
    const service = await this.repository.findActiveService(tenant.tenantId, serviceId);

    if (!service) {
      throw new AdminCalendarServiceNotFoundError();
    }

    return this.calculateSlots(tenant, service, query.startsAt, query.endsAt);
  }

  async createAppointment(
    context: AdminCalendarTenant | undefined,
    input: CreateAdminAppointmentInput,
  ): Promise<AdminCalendarAppointment> {
    const tenant = this.requireTenant(context);
    const service = await this.repository.findActiveService(tenant.tenantId, input.serviceId);

    if (!service) {
      throw new AdminCalendarServiceNotFoundError();
    }

    const endsAt = new Date(input.startsAt.getTime() + service.durationMinutes * 60_000);
    const requestedSlot = await this.requireAvailableSlot(tenant, service, input.startsAt, endsAt);
    const token = this.tokenGenerator();

    const appointment = await this.createConfirmed({
      tenantId: tenant.tenantId,
      serviceId: service.id,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      startsAt: requestedSlot.startsAt,
      endsAt: requestedSlot.endsAt,
      managementTokenHash: hashManagementToken(token),
      managementTokenExpiresAt: addDays(this.clock(), 7),
    });

    await this.notifyBookingCreated({
      customerEmail: appointment.customerEmail,
      customerName: appointment.customerName,
      serviceName: appointment.serviceName,
      startsAt: appointment.startsAt,
      timezone: tenant.timezone,
      token,
    });

    return appointment;
  }

  async rescheduleAppointment(
    context: AdminCalendarTenant | undefined,
    appointmentId: string,
    input: RescheduleAdminAppointmentInput,
  ): Promise<AdminCalendarAppointment> {
    const tenant = this.requireTenant(context);
    const existing = await this.requireConfirmedAppointment(tenant.tenantId, appointmentId);
    const service = await this.repository.findActiveService(tenant.tenantId, existing.serviceId);

    if (!service) {
      throw new AdminCalendarServiceNotFoundError();
    }

    const endsAt = new Date(input.startsAt.getTime() + service.durationMinutes * 60_000);
    const requestedSlot = await this.requireAvailableSlot(
      tenant,
      service,
      input.startsAt,
      endsAt,
      existing.id,
    );

    const rescheduled = await this.rescheduleConfirmed(
      tenant.tenantId,
      existing.id,
      requestedSlot.startsAt,
      requestedSlot.endsAt,
    );

    await this.notifyAppointment("bookingRescheduled", tenant.timezone, rescheduled);

    return rescheduled;
  }

  async cancelAppointment(
    context: AdminCalendarTenant | undefined,
    appointmentId: string,
  ): Promise<AdminCalendarAppointment> {
    const tenant = this.requireTenant(context);
    const existing = await this.requireConfirmedAppointment(tenant.tenantId, appointmentId);
    const canceled = await this.repository.cancelAppointment(tenant.tenantId, existing.id);

    if (!canceled) {
      throw new AdminCalendarAppointmentCanceledError();
    }

    await this.notifyAppointment("bookingCanceled", tenant.timezone, canceled);

    return canceled;
  }

  private requireTenant(context: AdminCalendarTenant | undefined): AdminCalendarTenant {
    if (!context) {
      throw new AdminCalendarTenantRequiredError();
    }

    return context;
  }

  private async calculateSlots(
    tenant: AdminCalendarTenant,
    service: { id: string; durationMinutes: number },
    startsAt: Date,
    endsAt: Date,
    excludeAppointmentId?: string,
  ): Promise<readonly AdminCalendarSlot[]> {
    const [shortestDuration, workingHours, blocks, appointments] = await Promise.all([
      this.repository.findShortestActiveServiceDurationMinutes(tenant.tenantId),
      this.repository.listWorkingHours(tenant.tenantId),
      this.repository.listBlocks(tenant.tenantId, startsAt, endsAt),
      this.repository.listActiveAppointments(
        tenant.tenantId,
        startsAt,
        endsAt,
        excludeAppointmentId,
      ),
    ]);

    return calculateAvailableSlots({
      tenantTimezone: tenant.timezone,
      startsAt,
      endsAt,
      serviceDurationMinutes: service.durationMinutes,
      shortestActiveServiceDurationMinutes: shortestDuration ?? service.durationMinutes,
      workingHours,
      blocks,
      appointments,
    });
  }

  private async requireAvailableSlot(
    tenant: AdminCalendarTenant,
    service: { id: string; durationMinutes: number },
    startsAt: Date,
    endsAt: Date,
    excludeAppointmentId?: string,
  ): Promise<AdminCalendarSlot> {
    const conflictingAppointments = await this.repository.listActiveAppointments(
      tenant.tenantId,
      startsAt,
      endsAt,
      excludeAppointmentId,
    );

    if (conflictingAppointments.length > 0) {
      throw new AdminCalendarConflictError();
    }

    const slots = await this.calculateSlots(
      tenant,
      service,
      startsAt,
      endsAt,
      excludeAppointmentId,
    );
    const requestedSlot = slots.find(
      (slot) =>
        slot.startsAt.getTime() === startsAt.getTime() &&
        slot.endsAt.getTime() === endsAt.getTime(),
    );

    if (!requestedSlot) {
      throw new AdminCalendarInvalidSlotError();
    }

    return requestedSlot;
  }

  private async requireConfirmedAppointment(
    tenantId: string,
    appointmentId: string,
  ): Promise<AdminCalendarAppointment> {
    const appointment = await this.repository.findAppointment(tenantId, appointmentId);

    if (!appointment) {
      throw new AdminCalendarAppointmentNotFoundError();
    }

    if (appointment.status === "canceled") {
      throw new AdminCalendarAppointmentCanceledError();
    }

    return appointment;
  }

  private async createConfirmed(
    input: Parameters<AdminCalendarRepository["createConfirmed"]>[0],
  ): Promise<AdminCalendarAppointment> {
    try {
      return await this.repository.createConfirmed(input);
    } catch (error) {
      if (isAppointmentConflictError(error)) {
        throw new AdminCalendarConflictError();
      }

      throw error;
    }
  }

  private async rescheduleConfirmed(
    tenantId: string,
    appointmentId: string,
    startsAt: Date,
    endsAt: Date,
  ): Promise<AdminCalendarAppointment> {
    try {
      const rescheduled = await this.repository.rescheduleAppointment(
        tenantId,
        appointmentId,
        startsAt,
        endsAt,
      );

      if (!rescheduled) {
        throw new AdminCalendarAppointmentCanceledError();
      }

      return rescheduled;
    } catch (error) {
      if (isAppointmentConflictError(error)) {
        throw new AdminCalendarConflictError();
      }

      throw error;
    }
  }

  private async notifyBookingCreated(input: BookingCreatedNotification): Promise<void> {
    try {
      await this.notifications.bookingCreated(input);
    } catch (error) {
      this.logger.warn(
        `Admin booking notification bookingCreated failed for ${input.customerEmail}: ${getErrorMessage(error)}`,
      );
    }
  }

  private async notifyAppointment(
    type: "bookingCanceled" | "bookingRescheduled",
    timezone: string,
    appointment: AdminCalendarAppointment,
  ): Promise<void> {
    const input: BookingNotificationAppointment = {
      customerEmail: appointment.customerEmail,
      customerName: appointment.customerName,
      serviceName: appointment.serviceName,
      startsAt: appointment.startsAt,
      timezone,
    };

    try {
      await this.notifications[type](input);
    } catch (error) {
      this.logger.warn(
        `Admin booking notification ${type} failed for ${appointment.customerEmail}: ${getErrorMessage(error)}`,
      );
    }
  }
}

export class AdminCalendarTenantRequiredError extends Error {
  constructor() {
    super("Tenant context is required");
    this.name = "AdminCalendarTenantRequiredError";
  }
}

export class AdminCalendarServiceNotFoundError extends Error {
  constructor() {
    super("Admin calendar service not found");
    this.name = "AdminCalendarServiceNotFoundError";
  }
}

export class AdminCalendarAppointmentNotFoundError extends Error {
  constructor() {
    super("Admin calendar appointment not found");
    this.name = "AdminCalendarAppointmentNotFoundError";
  }
}

export class AdminCalendarInvalidSlotError extends Error {
  constructor() {
    super("Requested admin calendar slot is not available");
    this.name = "AdminCalendarInvalidSlotError";
  }
}

export class AdminCalendarConflictError extends Error {
  constructor() {
    super("Admin calendar appointment slot is no longer available");
    this.name = "AdminCalendarConflictError";
  }
}

export class AdminCalendarAppointmentCanceledError extends Error {
  constructor() {
    super("Admin calendar appointment is canceled");
    this.name = "AdminCalendarAppointmentCanceledError";
  }
}

function isAppointmentConflictError(error: unknown): boolean {
  return (
    error instanceof AdminCalendarConflictError ||
    (typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error.code === "23P01" || error.code === "23505"))
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
