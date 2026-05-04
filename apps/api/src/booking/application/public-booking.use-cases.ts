import { createHash, randomBytes } from "node:crypto";
import type {
  CreatePublicBookingInput,
  PublicAppointment,
  PublicService,
  PublicSlot,
  PublicSlotsQuery,
} from "@agendarhorario/shared";
import { addDays } from "date-fns";
import { calculateAvailableSlots } from "../../scheduling/domain/index.js";
import type { TenantContext } from "../../tenancy/domain/tenant-context.js";
import type { BookingManagementLinkSender } from "./booking-management-link.sender.js";
import type { PublicBookingRepository } from "./public-booking.repository.js";

type Clock = () => Date;
type TokenGenerator = () => string;
type PublicBookingTenant = Pick<TenantContext, "tenantId" | "timezone">;

export class PublicBookingUseCases {
  constructor(
    private readonly repository: PublicBookingRepository,
    private readonly managementLinkSender: BookingManagementLinkSender,
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

    await this.managementLinkSender.send({
      customerEmail: appointment.customerEmail,
      customerName: appointment.customerName,
      appointmentId: appointment.id,
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

    return canceled ?? existing;
  }

  private async calculateSlots(
    tenant: PublicBookingTenant,
    service: PublicService,
    startsAt: Date,
    endsAt: Date,
  ): Promise<readonly PublicSlot[]> {
    const [shortestDuration, workingHours, blocks, appointments] = await Promise.all([
      this.repository.findShortestActiveServiceDurationMinutes(tenant.tenantId),
      this.repository.listWorkingHours(tenant.tenantId),
      this.repository.listBlocks(tenant.tenantId, startsAt, endsAt),
      this.repository.listActiveAppointments(tenant.tenantId, startsAt, endsAt),
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
