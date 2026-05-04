import { describe, expect, it } from "vitest";
import type { AdminCalendarRepository } from "./admin-calendar.repository.js";
import {
  AdminCalendarTenantRequiredError,
  AdminCalendarUseCases,
} from "./admin-calendar.use-cases.js";

const tenant = {
  tenantId: "9ebfd1cf-0374-49fc-98e8-ac9f547c246c",
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

    const listed = await new AdminCalendarUseCases(repository).listAppointments(tenant, {
      startsAt: new Date("2026-05-04T12:00:00.000Z"),
      endsAt: new Date("2026-05-05T12:00:00.000Z"),
    });

    expect(listed).toHaveLength(2);
    expect(repository.lastCall).toEqual({
      tenantId: tenant.tenantId,
      startsAt: new Date("2026-05-04T12:00:00.000Z"),
      endsAt: new Date("2026-05-05T12:00:00.000Z"),
    });
  });

  it("requires a tenant context", async () => {
    await expect(
      new AdminCalendarUseCases(new FakeAdminCalendarRepository()).listAppointments(undefined, {
        startsAt: new Date("2026-05-04T12:00:00.000Z"),
        endsAt: new Date("2026-05-05T12:00:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(AdminCalendarTenantRequiredError);
  });
});

type FakeAppointment = Awaited<ReturnType<AdminCalendarRepository["listAppointments"]>>[number];

class FakeAdminCalendarRepository implements AdminCalendarRepository {
  appointments: FakeAppointment[] = [];
  lastCall:
    | {
        tenantId: string;
        startsAt: Date;
        endsAt: Date;
      }
    | undefined;

  listAppointments(tenantId: string, startsAt: Date, endsAt: Date) {
    this.lastCall = { tenantId, startsAt, endsAt };

    return Promise.resolve(this.appointments);
  }
}

function appointment(overrides: Partial<FakeAppointment> = {}): FakeAppointment {
  return {
    id: "43055f81-ecfb-4090-9245-82fcf88e93b5",
    tenantId: tenant.tenantId,
    serviceId: "79f71e05-cf69-4b20-acf2-64ba69fcc2ef",
    serviceName: "Corte masculino",
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
