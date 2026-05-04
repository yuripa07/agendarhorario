import { Test, type TestingModule } from "@nestjs/testing";
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { DATABASE, type Database } from "../../infrastructure/database/database.module.js";
import { appointments, services, tenants } from "../../infrastructure/database/schema.js";
import { AppModule } from "../../presentation/app.module.js";
import { DrizzlePublicBookingRepository } from "./drizzle-public-booking.repository.js";

describe("DrizzlePublicBookingRepository", () => {
  const tenantSlug = `booking-repo-${Date.now()}`;
  let moduleRef: TestingModule;
  let database: Database;
  let repository: DrizzlePublicBookingRepository;
  let tenantId: string;
  let serviceId: string;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    database = moduleRef.get<Database>(DATABASE);
    repository = new DrizzlePublicBookingRepository(database);

    const [tenant] = await database
      .insert(tenants)
      .values({ slug: tenantSlug, displayName: "Booking Repository Tenant" })
      .returning();

    tenantId = tenant.id;

    const [service] = await database
      .insert(services)
      .values({
        tenantId,
        name: "Corte",
        durationMinutes: 60,
        priceCents: 5000,
      })
      .returning();

    serviceId = service.id;
  });

  beforeEach(async () => {
    await database.delete(appointments).where(eq(appointments.tenantId, tenantId));
  });

  it("persists confirmed appointments with only the token hash", async () => {
    const created = await repository.createConfirmed({
      tenantId,
      serviceId,
      customerName: "Maria Silva",
      customerEmail: "maria@example.com",
      customerPhone: "+5511999999999",
      startsAt: new Date("2026-05-04T12:00:00.000Z"),
      endsAt: new Date("2026-05-04T13:00:00.000Z"),
      managementTokenHash: "hashed-token",
      managementTokenExpiresAt: new Date("2026-05-10T12:00:00.000Z"),
    });

    expect(created.status).toBe("confirmed");

    const stored = await database.query.appointments.findFirst({
      where: eq(appointments.id, created.id),
    });

    expect(stored?.managementTokenHash).toBe("hashed-token");
    expect(JSON.stringify(stored)).not.toContain("raw-token");
  });

  it("looks up, cancels and rejects expired management tokens", async () => {
    const created = await repository.createConfirmed({
      tenantId,
      serviceId,
      customerName: "Maria Silva",
      customerEmail: "maria@example.com",
      customerPhone: "+5511999999999",
      startsAt: new Date("2026-05-04T12:00:00.000Z"),
      endsAt: new Date("2026-05-04T13:00:00.000Z"),
      managementTokenHash: "valid-token-hash",
      managementTokenExpiresAt: new Date("2026-05-10T12:00:00.000Z"),
    });

    await expect(repository.findByManagementTokenHash("valid-token-hash")).resolves.toMatchObject({
      id: created.id,
      status: "confirmed",
    });

    await expect(repository.cancelByManagementTokenHash("valid-token-hash")).resolves.toMatchObject(
      {
        id: created.id,
        status: "canceled",
      },
    );

    await expect(
      repository.findByManagementTokenHash("missing-token-hash"),
    ).resolves.toBeUndefined();
  });

  it("prevents overlapping active appointments and allows reuse after cancel", async () => {
    await repository.createConfirmed({
      tenantId,
      serviceId,
      customerName: "Maria Silva",
      customerEmail: "maria@example.com",
      customerPhone: "+5511999999999",
      startsAt: new Date("2026-05-04T12:00:00.000Z"),
      endsAt: new Date("2026-05-04T13:00:00.000Z"),
      managementTokenHash: "first-token-hash",
      managementTokenExpiresAt: new Date("2026-05-10T12:00:00.000Z"),
    });

    await expect(
      repository.createConfirmed({
        tenantId,
        serviceId,
        customerName: "Ana Souza",
        customerEmail: "ana@example.com",
        customerPhone: "+5511888888888",
        startsAt: new Date("2026-05-04T12:30:00.000Z"),
        endsAt: new Date("2026-05-04T13:30:00.000Z"),
        managementTokenHash: "second-token-hash",
        managementTokenExpiresAt: new Date("2026-05-10T12:00:00.000Z"),
      }),
    ).rejects.toThrow();

    await repository.cancelByManagementTokenHash("first-token-hash");

    await expect(
      repository.createConfirmed({
        tenantId,
        serviceId,
        customerName: "Ana Souza",
        customerEmail: "ana@example.com",
        customerPhone: "+5511888888888",
        startsAt: new Date("2026-05-04T12:30:00.000Z"),
        endsAt: new Date("2026-05-04T13:30:00.000Z"),
        managementTokenHash: "second-token-hash",
        managementTokenExpiresAt: new Date("2026-05-10T12:00:00.000Z"),
      }),
    ).resolves.toMatchObject({ status: "confirmed" });
  });
});
