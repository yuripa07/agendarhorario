import type { CreatePublicBookingInput } from "@agendarhorario/shared";
import { describe, expect, it } from "vitest";
import type { BookingManagementLinkSender } from "./booking-management-link.sender.js";
import type { PublicBookingRepository } from "./public-booking.repository.js";
import {
  PublicBookingConflictError,
  PublicBookingInvalidSlotError,
  PublicBookingServiceNotFoundError,
  PublicBookingTenantRequiredError,
  PublicBookingTokenExpiredError,
  PublicBookingUseCases,
} from "./public-booking.use-cases.js";

const tenant = {
  tenantId: "9ebfd1cf-0374-49fc-98e8-ac9f547c246c",
  timezone: "America/Sao_Paulo",
};

describe("PublicBookingUseCases", () => {
  it("lists only active services for the current tenant", async () => {
    const repository = new FakePublicBookingRepository();
    repository.services = [
      service({ id: "79f71e05-cf69-4b20-acf2-64ba69fcc2ef", isActive: true }),
      service({ id: "de2bd64b-e45c-4593-881e-7c2fa1beab1b", isActive: false }),
    ];

    const useCases = createUseCases(repository);

    await expect(useCases.listServices(tenant)).resolves.toHaveLength(1);
    expect(repository.lastTenantId).toBe(tenant.tenantId);
  });

  it("calculates public slots using working hours, blocks and confirmed appointments", async () => {
    const repository = new FakePublicBookingRepository();
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
    repository.appointments = [
      {
        startsAt: new Date("2026-05-04T15:00:00.000Z"),
        endsAt: new Date("2026-05-04T16:00:00.000Z"),
      },
    ];

    const slots = await createUseCases(repository).listSlots(tenant, repository.services[0].id, {
      startsAt: new Date("2026-05-04T12:00:00.000Z"),
      endsAt: new Date("2026-05-04T16:00:00.000Z"),
    });

    expect(slots).toEqual([
      {
        startsAt: new Date("2026-05-04T14:00:00.000Z"),
        endsAt: new Date("2026-05-04T15:00:00.000Z"),
        score: 0,
        isAdjacent: true,
      },
    ]);
  });

  it("rejects inactive services and missing tenants", async () => {
    const repository = new FakePublicBookingRepository();
    repository.services = [service({ isActive: false })];
    const useCases = createUseCases(repository);

    await expect(
      useCases.listSlots(tenant, repository.services[0].id, {
        startsAt: new Date("2026-05-04T12:00:00.000Z"),
        endsAt: new Date("2026-05-04T16:00:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(PublicBookingServiceNotFoundError);

    await expect(useCases.listServices(undefined)).rejects.toBeInstanceOf(
      PublicBookingTenantRequiredError,
    );
  });

  it("creates a confirmed booking only when the requested slot is still available", async () => {
    const repository = new FakePublicBookingRepository();
    const sender = new CapturingManagementLinkSender();
    repository.services = [service({ durationMinutes: 60 })];
    repository.workingHours = [
      { weekday: 1, startMinutes: 9 * 60, endMinutes: 12 * 60, isActive: true },
    ];

    const useCases = createUseCases(repository, sender);
    const input = bookingInput({
      serviceId: repository.services[0].id,
      startsAt: new Date("2026-05-04T12:00:00.000Z"),
    });

    const created = await useCases.createBooking(tenant, input);

    expect(created.status).toBe("confirmed");
    expect(created).not.toHaveProperty("managementToken");
    expect(repository.createdAppointments[0]?.managementTokenHash).not.toBe("raw-management-token");
    expect(sender.messages[0]).toMatchObject({
      customerEmail: input.customerEmail,
      token: "raw-management-token",
    });

    await expect(useCases.createBooking(tenant, input)).rejects.toBeInstanceOf(
      PublicBookingConflictError,
    );
  });

  it("rejects startsAt values that are not present in the calculated slots", async () => {
    const repository = new FakePublicBookingRepository();
    repository.services = [service({ durationMinutes: 60 })];
    repository.workingHours = [
      { weekday: 1, startMinutes: 9 * 60, endMinutes: 12 * 60, isActive: true },
    ];

    await expect(
      createUseCases(repository).createBooking(
        tenant,
        bookingInput({
          serviceId: repository.services[0].id,
          startsAt: new Date("2026-05-04T12:30:00.000Z"),
        }),
      ),
    ).rejects.toBeInstanceOf(PublicBookingInvalidSlotError);
  });

  it("looks up and cancels by a non-expired management token", async () => {
    const repository = new FakePublicBookingRepository();
    repository.managementAppointment = {
      id: "appointment-1",
      tenantId: tenant.tenantId,
      serviceId: "service-1",
      customerName: "Maria Silva",
      customerEmail: "maria@example.com",
      customerPhone: "+5511999999999",
      startsAt: new Date("2026-05-04T12:00:00.000Z"),
      endsAt: new Date("2026-05-04T13:00:00.000Z"),
      status: "confirmed",
      managementTokenExpiresAt: new Date("2026-05-10T00:00:00.000Z"),
      canceledAt: null,
    };

    const useCases = createUseCases(repository);

    await expect(useCases.lookupByToken("lookup-token")).resolves.toMatchObject({
      customerEmail: "maria@example.com",
      status: "confirmed",
    });

    await expect(useCases.cancelByToken("lookup-token")).resolves.toMatchObject({
      status: "canceled",
    });
  });

  it("rejects expired management tokens", async () => {
    const repository = new FakePublicBookingRepository();
    repository.managementAppointment = {
      id: "appointment-1",
      tenantId: tenant.tenantId,
      serviceId: "service-1",
      customerName: "Maria Silva",
      customerEmail: "maria@example.com",
      customerPhone: "+5511999999999",
      startsAt: new Date("2026-05-04T12:00:00.000Z"),
      endsAt: new Date("2026-05-04T13:00:00.000Z"),
      status: "confirmed",
      managementTokenExpiresAt: new Date("2026-05-02T00:00:00.000Z"),
      canceledAt: null,
    };

    await expect(createUseCases(repository).lookupByToken("expired-token")).rejects.toBeInstanceOf(
      PublicBookingTokenExpiredError,
    );
  });
});

function createUseCases(
  repository: FakePublicBookingRepository,
  sender: BookingManagementLinkSender = new CapturingManagementLinkSender(),
): PublicBookingUseCases {
  return new PublicBookingUseCases(
    repository,
    sender,
    () => new Date("2026-05-03T00:00:00.000Z"),
    () => "raw-management-token",
  );
}

function service(overrides: Partial<FakeService> = {}): FakeService {
  return {
    id: "79f71e05-cf69-4b20-acf2-64ba69fcc2ef",
    tenantId: tenant.tenantId,
    name: "Corte",
    durationMinutes: 60,
    priceCents: 5000,
    isActive: true,
    createdAt: new Date("2026-05-03T00:00:00.000Z"),
    updatedAt: new Date("2026-05-03T00:00:00.000Z"),
    ...overrides,
  };
}

function bookingInput(overrides: Partial<CreatePublicBookingInput>): CreatePublicBookingInput {
  return {
    serviceId: "79f71e05-cf69-4b20-acf2-64ba69fcc2ef",
    startsAt: new Date("2026-05-04T12:00:00.000Z"),
    customerName: "Maria Silva",
    customerEmail: "maria@example.com",
    customerPhone: "+5511999999999",
    privacyAccepted: true,
    ...overrides,
  };
}

type FakeService = Awaited<ReturnType<PublicBookingRepository["listActiveServices"]>>[number];

class CapturingManagementLinkSender implements BookingManagementLinkSender {
  readonly messages: Array<{
    customerEmail: string;
    customerName: string;
    appointmentId: string;
    token: string;
  }> = [];

  send(input: {
    customerEmail: string;
    customerName: string;
    appointmentId: string;
    token: string;
  }): Promise<void> {
    this.messages.push(input);

    return Promise.resolve();
  }
}

class FakePublicBookingRepository implements PublicBookingRepository {
  services: FakeService[] = [];
  workingHours: Awaited<ReturnType<PublicBookingRepository["listWorkingHours"]>> = [];
  blocks: Awaited<ReturnType<PublicBookingRepository["listBlocks"]>> = [];
  appointments: Awaited<ReturnType<PublicBookingRepository["listActiveAppointments"]>> = [];
  createdAppointments: Array<Parameters<PublicBookingRepository["createConfirmed"]>[0]> = [];
  managementAppointment: Awaited<ReturnType<PublicBookingRepository["findByManagementTokenHash"]>>;
  lastTenantId: string | undefined;

  listActiveServices(tenantId: string) {
    this.lastTenantId = tenantId;

    return Promise.resolve(this.services.filter((current) => current.isActive));
  }

  findActiveService(tenantId: string, serviceId: string) {
    this.lastTenantId = tenantId;

    return Promise.resolve(
      this.services.find((current) => current.id === serviceId && current.isActive),
    );
  }

  findShortestActiveServiceDurationMinutes() {
    return Promise.resolve(
      Math.min(
        ...this.services
          .filter((current) => current.isActive)
          .map((current) => current.durationMinutes),
      ),
    );
  }

  listWorkingHours() {
    return Promise.resolve(this.workingHours);
  }

  listBlocks() {
    return Promise.resolve(this.blocks);
  }

  listActiveAppointments() {
    return Promise.resolve(this.appointments);
  }

  createConfirmed(input: Parameters<PublicBookingRepository["createConfirmed"]>[0]) {
    const conflicts = this.appointments.some(
      (appointment) => input.startsAt < appointment.endsAt && appointment.startsAt < input.endsAt,
    );

    if (conflicts) {
      throw new PublicBookingConflictError();
    }

    this.createdAppointments.push(input);
    this.appointments.push({ startsAt: input.startsAt, endsAt: input.endsAt });

    return Promise.resolve({
      id: "appointment-1",
      tenantId: input.tenantId,
      serviceId: input.serviceId,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      status: "confirmed" as const,
      managementTokenExpiresAt: input.managementTokenExpiresAt,
      canceledAt: null,
    });
  }

  findByManagementTokenHash() {
    return Promise.resolve(this.managementAppointment);
  }

  cancelByManagementTokenHash() {
    if (!this.managementAppointment) {
      return Promise.resolve(undefined);
    }

    this.managementAppointment = {
      ...this.managementAppointment,
      status: "canceled",
      canceledAt: new Date("2026-05-03T00:00:00.000Z"),
    };

    return Promise.resolve(this.managementAppointment);
  }
}
