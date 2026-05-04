import { Test, type TestingModule } from "@nestjs/testing";
import { eq } from "drizzle-orm";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { DrizzlePublicBookingRepository } from "../src/booking/infrastructure/drizzle-public-booking.repository.js";
import { DATABASE, type Database } from "../src/infrastructure/database/database.module.js";
import { appointments, services, tenants } from "../src/infrastructure/database/schema.js";
import { AppModule } from "../src/presentation/app.module.js";

describe("DrizzlePublicBookingRepository", () => {
  const tenantSlug = `booking-repo-${Date.now()}`;
  const hashedToken = `${tenantSlug}-hashed-token`;
  const validTokenHash = `${tenantSlug}-valid-token-hash`;
  const firstTokenHash = `${tenantSlug}-first-token-hash`;
  const secondTokenHash = `${tenantSlug}-second-token-hash`;
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

    tenantId = requireRecord(tenant).id;

    const [service] = await database
      .insert(services)
      .values({
        tenantId,
        name: "Corte",
        durationMinutes: 60,
        priceCents: 5000,
      })
      .returning();

    serviceId = requireRecord(service).id;
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
      managementTokenHash: hashedToken,
      managementTokenExpiresAt: new Date("2026-05-10T12:00:00.000Z"),
    });

    expect(created.status).toBe("confirmed");

    const stored = await database.query.appointments.findFirst({
      where: eq(appointments.id, created.id),
    });

    expect(stored?.managementTokenHash).toBe(hashedToken);
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
      managementTokenHash: validTokenHash,
      managementTokenExpiresAt: new Date("2026-05-10T12:00:00.000Z"),
    });

    await expect(repository.findByManagementTokenHash(validTokenHash)).resolves.toMatchObject({
      id: created.id,
      status: "confirmed",
    });

    await expect(repository.cancelByManagementTokenHash(validTokenHash)).resolves.toMatchObject({
      id: created.id,
      status: "canceled",
    });

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
      managementTokenHash: firstTokenHash,
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
        managementTokenHash: secondTokenHash,
        managementTokenExpiresAt: new Date("2026-05-10T12:00:00.000Z"),
      }),
    ).rejects.toThrow();

    await repository.cancelByManagementTokenHash(firstTokenHash);

    await expect(
      repository.createConfirmed({
        tenantId,
        serviceId,
        customerName: "Ana Souza",
        customerEmail: "ana@example.com",
        customerPhone: "+5511888888888",
        startsAt: new Date("2026-05-04T12:30:00.000Z"),
        endsAt: new Date("2026-05-04T13:30:00.000Z"),
        managementTokenHash: secondTokenHash,
        managementTokenExpiresAt: new Date("2026-05-10T12:00:00.000Z"),
      }),
    ).resolves.toMatchObject({ status: "confirmed" });
  });
});

function requireRecord<T>(record: T | undefined): T {
  if (!record) {
    throw new Error("Expected database record");
  }

  return record;
}
