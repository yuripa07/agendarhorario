import type { AdminCalendarAppointment, PublicService } from "@agendarhorario/shared";
import { describe, expect, it } from "vitest";
import type { SmartSlotInterval, SmartSlotWorkingHour } from "../../scheduling/domain/index.js";
import type { AdminCalendarRepository } from "./admin-calendar.repository.js";
import {
  AdminCalendarAppointmentCanceledError,
  AdminCalendarConflictError,
  AdminCalendarInvalidSlotError,
  AdminCalendarTenantRequiredError,
  AdminCalendarUseCases,
} from "./admin-calendar.use-cases.js";
import type {
  BookingCreatedNotification,
  BookingNotificationAppointment,
  BookingNotificationSender,
} from "./booking-notification.sender.js";
import { hashManagementToken } from "./public-booking.use-cases.js";

const tenant = {
  tenantId: "9ebfd1cf-0374-49fc-98e8-ac9f547c246c",
  timezone: "America/Sao_Paulo",
};

describe("AdminCalendarUseCases", () => {
  it("lists tenant appointments for a UTC calendar window", async () => {
    const repository = new FakeAdminCalendarRepository();
    repository.appointments = [
      appointment({ id: "43055f81-ecfb-4090-9245-82fcf88e93b5" }),
      appointment({
        id: "0374591a-1654-4c98-8768-6b715cf93573",
        startsAt: new Date("2026-05-04T15:00:00.000Z"),
        endsAt: new Date("2026-05-04T16:00:00.000Z"),
      }),
    ];

    const listed = await createUseCases(repository).listAppointments(tenant, {
      startsAt: new Date("2026-05-04T12:00:00.000Z"),
      endsAt: new Date("2026-05-05T12:00:00.000Z"),
    });

    expect(listed).toHaveLength(2);
    expect(repository.lastListCall).toEqual({
      tenantId: tenant.tenantId,
      startsAt: new Date("2026-05-04T12:00:00.000Z"),
      endsAt: new Date("2026-05-05T12:00:00.000Z"),
    });
  });

  it("calculates admin slots with working hours, blocks and appointments", async () => {
    const repository = new FakeAdminCalendarRepository();
    repository.services = [service({ durationMinutes: 60 })];
    repository.workingHours = [
      { weekday: 1, startMinutes: 9 * 60, endMinutes: 12 * 60, isActive: true },
    ];
    repository.blocks = [
      {
        startsAt: new Date("2026-05-04T13:00:00.000Z"),
        endsAt: new Date("2026-05-04T14:00:00.000Z"),
      },
    ];
    repository.activeAppointmentIntervals = [
      {
        startsAt: new Date("2026-05-04T15:00:00.000Z"),
        endsAt: new Date("2026-05-04T16:00:00.000Z"),
      },
    ];

    const activeService = requireValue(repository.services[0]);
    const slots = await createUseCases(repository).listSlots(tenant, activeService.id, {
      startsAt: new Date("2026-05-04T12:00:00.000Z"),
      endsAt: new Date("2026-05-04T16:00:00.000Z"),
    });

    expect(slots.map((slot) => slot.startsAt.toISOString())).toEqual([
      "2026-05-04T14:00:00.000Z",
      "2026-05-04T12:00:00.000Z",
    ]);
  });

  it("creates a confirmed appointment and sends a creation notification", async () => {
    const repository = new FakeAdminCalendarRepository();
    const sender = new CapturingBookingNotificationSender();
    repository.services = [service({ id: "79f71e05-cf69-4b20-acf2-64ba69fcc2ef" })];
    repository.workingHours = [
      { weekday: 1, startMinutes: 9 * 60, endMinutes: 12 * 60, isActive: true },
    ];

    const created = await createUseCases(repository, sender).createAppointment(tenant, {
      serviceId: "79f71e05-cf69-4b20-acf2-64ba69fcc2ef",
      startsAt: new Date("2026-05-04T12:00:00.000Z"),
      customerName: "Maria Silva",
      customerEmail: "maria@example.com",
      customerPhone: "+5511999999999",
    });

    expect(created.status).toBe("confirmed");
    expect(repository.createdAppointments[0]).toMatchObject({
      managementTokenHash: hashManagementToken("raw-admin-token"),
      managementTokenExpiresAt: new Date("2026-05-08T00:00:00.000Z"),
    });
    expect(sender.created[0]).toMatchObject({
      customerEmail: "maria@example.com",
      serviceName: "Corte",
      startsAt: new Date("2026-05-04T12:00:00.000Z"),
      timezone: tenant.timezone,
      token: "raw-admin-token",
    });
  });

  it("rejects invalid and conflicting create slots", async () => {
    const repository = new FakeAdminCalendarRepository();
    repository.services = [service({ id: "79f71e05-cf69-4b20-acf2-64ba69fcc2ef" })];
    repository.workingHours = [
      { weekday: 1, startMinutes: 9 * 60, endMinutes: 12 * 60, isActive: true },
    ];

    await expect(
      createUseCases(repository).createAppointment(tenant, {
        serviceId: "79f71e05-cf69-4b20-acf2-64ba69fcc2ef",
        startsAt: new Date("2026-05-04T12:30:00.000Z"),
        customerName: "Maria Silva",
        customerEmail: "maria@example.com",
        customerPhone: "+5511999999999",
      }),
    ).rejects.toBeInstanceOf(AdminCalendarInvalidSlotError);

    repository.activeAppointmentIntervals = [
      {
        startsAt: new Date("2026-05-04T12:00:00.000Z"),
        endsAt: new Date("2026-05-04T13:00:00.000Z"),
      },
    ];

    await expect(
      createUseCases(repository).createAppointment(tenant, {
        serviceId: "79f71e05-cf69-4b20-acf2-64ba69fcc2ef",
        startsAt: new Date("2026-05-04T12:00:00.000Z"),
        customerName: "Maria Silva",
        customerEmail: "maria@example.com",
        customerPhone: "+5511999999999",
      }),
    ).rejects.toBeInstanceOf(AdminCalendarConflictError);
  });

  it("reschedules a confirmed appointment and sends a reschedule notification", async () => {
    const repository = new FakeAdminCalendarRepository();
    const sender = new CapturingBookingNotificationSender();
    repository.services = [service({ id: "79f71e05-cf69-4b20-acf2-64ba69fcc2ef" })];
    repository.workingHours = [
      { weekday: 1, startMinutes: 9 * 60, endMinutes: 12 * 60, isActive: true },
    ];
    repository.appointments = [
      appointment({
        id: "43055f81-ecfb-4090-9245-82fcf88e93b5",
        serviceId: "79f71e05-cf69-4b20-acf2-64ba69fcc2ef",
      }),
    ];

    await expect(
      createUseCases(repository, sender).rescheduleAppointment(
        tenant,
        "43055f81-ecfb-4090-9245-82fcf88e93b5",
        {
          startsAt: new Date("2026-05-04T14:00:00.000Z"),
        },
      ),
    ).resolves.toMatchObject({
      startsAt: new Date("2026-05-04T14:00:00.000Z"),
      endsAt: new Date("2026-05-04T15:00:00.000Z"),
    });
    expect(repository.lastExcludeAppointmentId).toBe("43055f81-ecfb-4090-9245-82fcf88e93b5");
    expect(sender.rescheduled[0]).toMatchObject({
      customerEmail: "maria@example.com",
      startsAt: new Date("2026-05-04T14:00:00.000Z"),
    });
  });

  it("cancels a confirmed appointment and rejects canceled appointments", async () => {
    const repository = new FakeAdminCalendarRepository();
    const sender = new CapturingBookingNotificationSender();
    repository.appointments = [appointment({ id: "43055f81-ecfb-4090-9245-82fcf88e93b5" })];

    await expect(
      createUseCases(repository, sender).cancelAppointment(
        tenant,
        "43055f81-ecfb-4090-9245-82fcf88e93b5",
      ),
    ).resolves.toMatchObject({ status: "canceled" });
    expect(sender.canceled[0]).toMatchObject({
      customerEmail: "maria@example.com",
      startsAt: new Date("2026-05-04T12:00:00.000Z"),
    });

    await expect(
      createUseCases(repository).cancelAppointment(tenant, "43055f81-ecfb-4090-9245-82fcf88e93b5"),
    ).rejects.toBeInstanceOf(AdminCalendarAppointmentCanceledError);
  });

  it("requires a tenant context", async () => {
    await expect(
      createUseCases(new FakeAdminCalendarRepository()).listAppointments(undefined, {
        startsAt: new Date("2026-05-04T12:00:00.000Z"),
        endsAt: new Date("2026-05-05T12:00:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(AdminCalendarTenantRequiredError);
  });
});

function createUseCases(
  repository: FakeAdminCalendarRepository,
  sender: BookingNotificationSender = new CapturingBookingNotificationSender(),
): AdminCalendarUseCases {
  return new AdminCalendarUseCases(
    repository,
    sender,
    () => new Date("2026-05-01T00:00:00.000Z"),
    () => "raw-admin-token",
  );
}

class FakeAdminCalendarRepository implements AdminCalendarRepository {
  services: PublicService[] = [service({ id: "79f71e05-cf69-4b20-acf2-64ba69fcc2ef" })];
  appointments: AdminCalendarAppointment[] = [];
  workingHours: SmartSlotWorkingHour[] = [];
  blocks: SmartSlotInterval[] = [];
  activeAppointmentIntervals: SmartSlotInterval[] = [];
  createdAppointments: Parameters<AdminCalendarRepository["createConfirmed"]>[0][] = [];
  lastExcludeAppointmentId: string | undefined;
  lastListCall:
    | {
        tenantId: string;
        startsAt: Date;
        endsAt: Date;
      }
    | undefined;

  findActiveService(_tenantId: string, serviceId: string) {
    return Promise.resolve(
      this.services.find((item) => item.id === serviceId && item.isActive) ?? undefined,
    );
  }

  findShortestActiveServiceDurationMinutes() {
    const activeDurations = this.services
      .filter((item) => item.isActive)
      .map((item) => item.durationMinutes);

    return Promise.resolve(activeDurations.length > 0 ? Math.min(...activeDurations) : undefined);
  }

  listWorkingHours() {
    return Promise.resolve(this.workingHours);
  }

  listBlocks() {
    return Promise.resolve(this.blocks);
  }

  listActiveAppointments(
    _tenantId: string,
    _startsAt: Date,
    _endsAt: Date,
    excludeAppointmentId?: string,
  ) {
    this.lastExcludeAppointmentId = excludeAppointmentId;

    return Promise.resolve(this.activeAppointmentIntervals);
  }

  listAppointments(tenantId: string, startsAt: Date, endsAt: Date) {
    this.lastListCall = { tenantId, startsAt, endsAt };

    return Promise.resolve(this.appointments);
  }

  findAppointment(_tenantId: string, appointmentId: string) {
    return Promise.resolve(this.appointments.find((item) => item.id === appointmentId));
  }

  createConfirmed(input: Parameters<AdminCalendarRepository["createConfirmed"]>[0]) {
    this.createdAppointments.push(input);
    const serviceRecord = requireValue(this.services.find((item) => item.id === input.serviceId));
    const created = appointment({
      id: "0374591a-1654-4c98-8768-6b715cf93573",
      serviceId: input.serviceId,
      serviceName: serviceRecord.name,
      serviceDurationMinutes: serviceRecord.durationMinutes,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
    });
    this.appointments.push(created);

    return Promise.resolve(created);
  }

  rescheduleAppointment(_tenantId: string, appointmentId: string, startsAt: Date, endsAt: Date) {
    const existing = this.appointments.find(
      (item) => item.id === appointmentId && item.status === "confirmed",
    );

    if (!existing) {
      return Promise.resolve(undefined);
    }

    const rescheduled = { ...existing, startsAt, endsAt };
    this.appointments = this.appointments.map((item) =>
      item.id === appointmentId ? rescheduled : item,
    );

    return Promise.resolve(rescheduled);
  }

  cancelAppointment(_tenantId: string, appointmentId: string) {
    const existing = this.appointments.find(
      (item) => item.id === appointmentId && item.status === "confirmed",
    );

    if (!existing) {
      return Promise.resolve(undefined);
    }

    const canceled = {
      ...existing,
      status: "canceled" as const,
      canceledAt: new Date("2026-05-01T12:00:00.000Z"),
    };
    this.appointments = this.appointments.map((item) =>
      item.id === appointmentId ? canceled : item,
    );

    return Promise.resolve(canceled);
  }
}

class CapturingBookingNotificationSender implements BookingNotificationSender {
  created: BookingCreatedNotification[] = [];
  canceled: BookingNotificationAppointment[] = [];
  rescheduled: BookingNotificationAppointment[] = [];

  bookingCreated(input: BookingCreatedNotification): Promise<void> {
    this.created.push(input);
    return Promise.resolve();
  }

  bookingCanceled(input: BookingNotificationAppointment): Promise<void> {
    this.canceled.push(input);
    return Promise.resolve();
  }

  bookingRescheduled(input: BookingNotificationAppointment): Promise<void> {
    this.rescheduled.push(input);
    return Promise.resolve();
  }
}

function service(overrides: Partial<PublicService> = {}): PublicService {
  return {
    id: "79f71e05-cf69-4b20-acf2-64ba69fcc2ef",
    tenantId: tenant.tenantId,
    name: "Corte",
    durationMinutes: 60,
    priceCents: 8000,
    isActive: true,
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
    updatedAt: new Date("2026-05-01T00:00:00.000Z"),
    ...overrides,
  };
}

function appointment(overrides: Partial<AdminCalendarAppointment> = {}): AdminCalendarAppointment {
  return {
    id: "43055f81-ecfb-4090-9245-82fcf88e93b5",
    tenantId: tenant.tenantId,
    serviceId: "79f71e05-cf69-4b20-acf2-64ba69fcc2ef",
    serviceName: "Corte",
    serviceDurationMinutes: 60,
    customerName: "Maria Silva",
    customerEmail: "maria@example.com",
    customerPhone: "+5511999999999",
    startsAt: new Date("2026-05-04T12:00:00.000Z"),
    endsAt: new Date("2026-05-04T13:00:00.000Z"),
    status: "confirmed",
    canceledAt: null,
    ...overrides,
  };
}

function requireValue<T>(value: T | undefined): T {
  if (!value) {
    throw new Error("Expected value");
  }

  return value;
}
