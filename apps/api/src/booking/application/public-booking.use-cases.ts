import { createHash, randomBytes } from "node:crypto";
import type {
  CreatePublicBookingInput,
  PublicAppointment,
  PublicService,
  PublicSlot,
  PublicSlotsQuery,
  ReschedulePublicBookingInput,
} from "@agendarhorario/shared";
import { Logger } from "@nestjs/common";
import { addDays } from "date-fns";
import { calculateAvailableSlots } from "../../scheduling/domain/index.js";
import type { TenantContext } from "../../tenancy/domain/tenant-context.js";
import type {
  BookingCreatedNotification,
  BookingNotificationAppointment,
  BookingNotificationSender,
} from "./booking-notification.sender.js";
import type { PublicBookingRepository } from "./public-booking.repository.js";

type Clock = () => Date;
type TokenGenerator = () => string;
type PublicBookingTenant = Pick<TenantContext, "tenantId" | "timezone">;

export class PublicBookingUseCases {
  private readonly logger = new Logger(PublicBookingUseCases.name);

  constructor(
    private readonly repository: PublicBookingRepository,
    private readonly notifications: BookingNotificationSender,
    private readonly clock: Clock = () => new Date(),
    private readonly tokenGenerator: TokenGenerator = () => randomBytes(32).toString("base64url"),
  ) {}

  async listServices(context: PublicBookingTenant | undefined): Promise<readonly PublicService[]> {
    const tenant = this.requireTenant(context);

    return this.repository.listActiveServices(tenant.tenantId);
  }

  async listSlots(
    context: PublicBookingTenant | undefined,
    serviceId: string,
    query: PublicSlotsQuery,
  ): Promise<readonly PublicSlot[]> {
    const tenant = this.requireTenant(context);
    const service = await this.repository.findActiveService(tenant.tenantId, serviceId);

    if (!service) {
      throw new PublicBookingServiceNotFoundError();
    }

    return this.calculateSlots(tenant, service, query.startsAt, query.endsAt);
  }

  async createBooking(
    context: PublicBookingTenant | undefined,
    input: CreatePublicBookingInput,
  ): Promise<PublicAppointment> {
    const tenant = this.requireTenant(context);
    const service = await this.repository.findActiveService(tenant.tenantId, input.serviceId);

    if (!service) {
      throw new PublicBookingServiceNotFoundError();
    }

    const endsAt = new Date(input.startsAt.getTime() + service.durationMinutes * 60_000);
    const conflictingAppointments = await this.repository.listActiveAppointments(
      tenant.tenantId,
      input.startsAt,
      endsAt,
    );

    if (conflictingAppointments.length > 0) {
      throw new PublicBookingConflictError();
    }

    const slots = await this.calculateSlots(tenant, service, input.startsAt, endsAt);
    const requestedSlot = slots.find(
      (slot) =>
        slot.startsAt.getTime() === input.startsAt.getTime() &&
        slot.endsAt.getTime() === endsAt.getTime(),
    );

    if (!requestedSlot) {
      throw new PublicBookingInvalidSlotError();
    }

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
      serviceName: service.name,
      startsAt: appointment.startsAt,
      timezone: tenant.timezone,
      token,
    });

    return appointment;
  }

  async lookupByToken(token: string): Promise<PublicAppointment> {
    const appointment = await this.repository.findByManagementTokenHash(hashManagementToken(token));

    return this.requireValidManagementAppointment(appointment);
  }

  async cancelByToken(token: string): Promise<PublicAppointment> {
    const existing = await this.lookupByToken(token);
    const canceled = await this.repository.cancelByManagementTokenHash(hashManagementToken(token));
    const appointment = canceled ?? existing;

    await this.notifyAppointment("bookingCanceled", appointment);

    return appointment;
  }

  async rescheduleByToken(input: ReschedulePublicBookingInput): Promise<PublicAppointment> {
    const tokenHash = hashManagementToken(input.token);
    const existing = this.requireConfirmedManagementAppointment(
      await this.repository.findByManagementTokenHash(tokenHash),
    );
    const service = await this.repository.findActiveService(existing.tenantId, existing.serviceId);

    if (!service) {
      throw new PublicBookingServiceNotFoundError();
    }

    const timezone = await this.repository.findTenantTimezone(existing.tenantId);

    if (!timezone) {
      throw new PublicBookingTenantRequiredError();
    }

    const endsAt = new Date(input.startsAt.getTime() + service.durationMinutes * 60_000);
    const conflictingAppointments = await this.repository.listActiveAppointments(
      existing.tenantId,
      input.startsAt,
      endsAt,
      existing.id,
    );

    if (conflictingAppointments.length > 0) {
      throw new PublicBookingConflictError();
    }

    const slots = await this.calculateSlots(
      { tenantId: existing.tenantId, timezone },
      service,
      input.startsAt,
      endsAt,
      existing.id,
    );
    const requestedSlot = slots.find(
      (slot) =>
        slot.startsAt.getTime() === input.startsAt.getTime() &&
        slot.endsAt.getTime() === endsAt.getTime(),
    );

    if (!requestedSlot) {
      throw new PublicBookingInvalidSlotError();
    }

    try {
      const rescheduled = await this.repository.rescheduleByManagementTokenHash(
        tokenHash,
        requestedSlot.startsAt,
        requestedSlot.endsAt,
      );

      if (!rescheduled) {
        throw new PublicBookingAppointmentCanceledError();
      }

      await this.notifyBookingRescheduled({
        customerEmail: rescheduled.customerEmail,
        customerName: rescheduled.customerName,
        serviceName: service.name,
        startsAt: rescheduled.startsAt,
        timezone,
      });

      return rescheduled;
    } catch (error) {
      if (isAppointmentConflictError(error)) {
        throw new PublicBookingConflictError();
      }

      throw error;
    }
  }

  private async calculateSlots(
    tenant: PublicBookingTenant,
    service: PublicService,
    startsAt: Date,
    endsAt: Date,
    excludeAppointmentId?: string,
  ): Promise<readonly PublicSlot[]> {
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

  private async createConfirmed(input: Parameters<PublicBookingRepository["createConfirmed"]>[0]) {
    try {
      return await this.repository.createConfirmed(input);
    } catch (error) {
      if (isAppointmentConflictError(error)) {
        throw new PublicBookingConflictError();
      }

      throw error;
    }
  }

  private async notifyAppointment(
    type: "bookingCanceled" | "bookingRescheduled",
    appointment: PublicAppointment,
  ): Promise<void> {
    try {
      const [service, timezone] = await Promise.all([
        this.repository.findActiveService(appointment.tenantId, appointment.serviceId),
        this.repository.findTenantTimezone(appointment.tenantId),
      ]);

      const input: BookingNotificationAppointment = {
        customerEmail: appointment.customerEmail,
        customerName: appointment.customerName,
        startsAt: appointment.startsAt,
        timezone: timezone ?? "UTC",
      };

      if (service?.name) {
        await this.notify(type, { ...input, serviceName: service.name });

        return;
      }

      await this.notify(type, input);
    } catch (error) {
      this.logger.warn(
        `Booking notification ${type} failed for ${appointment.customerEmail}: ${getErrorMessage(error)}`,
      );
    }
  }

  private async notifyBookingCreated(input: BookingCreatedNotification): Promise<void> {
    try {
      await this.notifications.bookingCreated(input);
    } catch (error) {
      this.logger.warn(
        `Booking notification bookingCreated failed for ${input.customerEmail}: ${getErrorMessage(error)}`,
      );
    }
  }

  private async notifyBookingRescheduled(input: BookingNotificationAppointment): Promise<void> {
    await this.notify("bookingRescheduled", input);
  }

  private async notify(
    type: "bookingCanceled" | "bookingRescheduled",
    input: BookingNotificationAppointment,
  ): Promise<void> {
    try {
      await this.notifications[type](input);
    } catch (error) {
      this.logger.warn(
        `Booking notification ${type} failed for ${input.customerEmail}: ${getErrorMessage(error)}`,
      );
    }
  }

  private requireTenant(context: PublicBookingTenant | undefined): PublicBookingTenant {
    if (!context) {
      throw new PublicBookingTenantRequiredError();
    }

    return context;
  }

  private requireValidManagementAppointment(
    appointment: PublicAppointment | undefined,
  ): PublicAppointment {
    if (!appointment) {
      throw new PublicBookingTokenNotFoundError();
    }

    if (appointment.managementTokenExpiresAt <= this.clock()) {
      throw new PublicBookingTokenExpiredError();
    }

    return appointment;
  }

  private requireConfirmedManagementAppointment(
    appointment: PublicAppointment | undefined,
  ): PublicAppointment {
    const valid = this.requireValidManagementAppointment(appointment);

    if (valid.status === "canceled") {
      throw new PublicBookingAppointmentCanceledError();
    }

    return valid;
  }
}

export function hashManagementToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function isAppointmentConflictError(error: unknown): boolean {
  return (
    error instanceof PublicBookingConflictError ||
    (typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error.code === "23P01" || error.code === "23505"))
  );
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}

export class PublicBookingTenantRequiredError extends Error {
  constructor() {
    super("Tenant context is required");
    this.name = "PublicBookingTenantRequiredError";
  }
}

export class PublicBookingServiceNotFoundError extends Error {
  constructor() {
    super("Public booking service not found");
    this.name = "PublicBookingServiceNotFoundError";
  }
}

export class PublicBookingInvalidSlotError extends Error {
  constructor() {
    super("Requested slot is not available");
    this.name = "PublicBookingInvalidSlotError";
  }
}

export class PublicBookingConflictError extends Error {
  constructor() {
    super("Appointment slot is no longer available");
    this.name = "PublicBookingConflictError";
  }
}

export class PublicBookingAppointmentCanceledError extends Error {
  constructor() {
    super("Appointment is canceled");
    this.name = "PublicBookingAppointmentCanceledError";
  }
}

export class PublicBookingTokenNotFoundError extends Error {
  constructor() {
    super("Management token not found");
    this.name = "PublicBookingTokenNotFoundError";
  }
}

export class PublicBookingTokenExpiredError extends Error {
  constructor() {
    super("Management token expired");
    this.name = "PublicBookingTokenExpiredError";
  }
}
