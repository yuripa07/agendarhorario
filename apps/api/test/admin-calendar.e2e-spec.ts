import { Test, type TestingModule } from "@nestjs/testing";
import { eq } from "drizzle-orm";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ADMIN_CALENDAR_ROUTE } from "../src/booking/booking.constants.js";
import { DATABASE, type Database } from "../src/infrastructure/database/database.module.js";
import {
  appointments,
  services,
  tenants,
  user,
  workingHours,
} from "../src/infrastructure/database/schema.js";
import { AppModule } from "../src/presentation/app.module.js";

describe("Admin calendar", () => {
  const tenantSlug = `calendar-${Date.now()}`;
  const tenantHost = `${tenantSlug}.agendarhorario.com.br`;
  const otherTenantSlug = `calendar-other-${Date.now()}`;
  const adminEmail = `calendar-admin-${Date.now()}@example.com`;
  const adminPassword = "password123";

  let moduleRef: TestingModule;
  let database: Database;
  let server: Parameters<typeof request>[0];
  let sessionCookie: string;
  let tenantId: string;
  let serviceId: string;
  let appointmentToRescheduleId: string;
  let appointmentToCancelId: string;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    database = moduleRef.get<Database>(DATABASE);
    server = app.getHttpServer();

    const [tenant, otherTenant] = await database
      .insert(tenants)
      .values([
        { slug: tenantSlug, displayName: "Calendar Tenant" },
        { slug: otherTenantSlug, displayName: "Other Calendar Tenant" },
      ])
      .returning();

    const [service, otherTenantService] = await database
      .insert(services)
      .values([
        {
          tenantId: requireRecord(tenant).id,
          name: "Consulta",
          durationMinutes: 60,
          priceCents: 12000,
        },
        {
          tenantId: requireRecord(otherTenant).id,
          name: "Outro tenant",
          durationMinutes: 60,
          priceCents: 12000,
        },
      ])
      .returning();

    tenantId = requireRecord(tenant).id;
    serviceId = requireRecord(service).id;

    await database.insert(workingHours).values({
      tenantId,
      weekday: 1,
      startMinutes: 9 * 60,
      endMinutes: 18 * 60,
    });

    const insertedAppointments = await database
      .insert(appointments)
      .values([
        {
          tenantId,
          serviceId,
          customerName: "Maria Silva",
          customerEmail: "maria@example.com",
          customerPhone: "+5511999999999",
          startsAt: new Date("2026-05-04T12:00:00.000Z"),
          endsAt: new Date("2026-05-04T13:00:00.000Z"),
          status: "confirmed",
          managementTokenHash: `calendar-token-${Date.now()}-1`,
          managementTokenExpiresAt: new Date("2026-05-10T00:00:00.000Z"),
        },
        {
          tenantId,
          serviceId,
          customerName: "Ana Souza",
          customerEmail: "ana@example.com",
          customerPhone: "+5511888888888",
          startsAt: new Date("2026-05-05T12:00:00.000Z"),
          endsAt: new Date("2026-05-05T13:00:00.000Z"),
          status: "confirmed",
          managementTokenHash: `calendar-token-${Date.now()}-2`,
          managementTokenExpiresAt: new Date("2026-05-10T00:00:00.000Z"),
        },
        {
          tenantId,
          serviceId,
          customerName: "Bruno Lima",
          customerEmail: "bruno@example.com",
          customerPhone: "+5511666666666",
          startsAt: new Date("2026-05-05T18:00:00.000Z"),
          endsAt: new Date("2026-05-05T19:00:00.000Z"),
          status: "confirmed",
          managementTokenHash: `calendar-token-${Date.now()}-4`,
          managementTokenExpiresAt: new Date("2026-05-10T00:00:00.000Z"),
        },
        {
          tenantId: requireRecord(otherTenant).id,
          serviceId: requireRecord(otherTenantService).id,
          customerName: "Outro Cliente",
          customerEmail: "outro@example.com",
          customerPhone: "+5511777777777",
          startsAt: new Date("2026-05-04T12:00:00.000Z"),
          endsAt: new Date("2026-05-04T13:00:00.000Z"),
          status: "confirmed",
          managementTokenHash: `calendar-token-${Date.now()}-3`,
          managementTokenExpiresAt: new Date("2026-05-10T00:00:00.000Z"),
        },
      ])
      .returning();

    appointmentToRescheduleId = requireRecord(insertedAppointments[1]).id;
    appointmentToCancelId = requireRecord(insertedAppointments[2]).id;

    const authResponse = await request(server).post("/auth/sign-up/email").send({
      email: adminEmail,
      password: adminPassword,
      name: "Calendar Admin",
    });

    expect(authResponse.status).toBe(200);
    expect(authResponse.headers["set-cookie"]).toBeDefined();

    const setCookie = authResponse.headers["set-cookie"];

    if (!setCookie) {
      throw new AuthCookieMissingError();
    }

    sessionCookie = setCookie;
  });

  afterAll(async () => {
    await database?.delete(user).where(eq(user.email, adminEmail));
    await database?.delete(tenants).where(eq(tenants.slug, tenantSlug));
    await database?.delete(tenants).where(eq(tenants.slug, otherTenantSlug));
    await moduleRef?.close();
  });

  it("lists appointments for the current tenant calendar window", async () => {
    const listed = await request(server)
      .get(`/${ADMIN_CALENDAR_ROUTE}/appointments`)
      .set("Host", tenantHost)
      .set("Cookie", sessionCookie)
      .query({
        startsAt: "2026-05-04T00:00:00.000Z",
        endsAt: "2026-05-05T00:00:00.000Z",
      })
      .expect(200);

    expect(listed.body).toHaveLength(1);
    expect(listed.body[0]).toMatchObject({
      serviceName: "Consulta",
      serviceDurationMinutes: 60,
      customerName: "Maria Silva",
      customerEmail: "maria@example.com",
      startsAt: "2026-05-04T12:00:00.000Z",
      endsAt: "2026-05-04T13:00:00.000Z",
      status: "confirmed",
    });
  });

  it("rejects anonymous calendar requests", async () => {
    await request(server)
      .get(`/${ADMIN_CALENDAR_ROUTE}/appointments`)
      .set("Host", tenantHost)
      .query({
        startsAt: "2026-05-04T00:00:00.000Z",
        endsAt: "2026-05-05T00:00:00.000Z",
      })
      .expect(401);
  });

  it("lists admin slots for an active service", async () => {
    const listed = await request(server)
      .get(`/${ADMIN_CALENDAR_ROUTE}/services/${serviceId}/slots`)
      .set("Host", tenantHost)
      .set("Cookie", sessionCookie)
      .query({
        startsAt: "2026-05-04T12:00:00.000Z",
        endsAt: "2026-05-04T18:00:00.000Z",
      })
      .expect(200);

    expect(listed.body.map((slot: { startsAt: string }) => slot.startsAt)).toContain(
      "2026-05-04T13:00:00.000Z",
    );
    expect(listed.body.map((slot: { startsAt: string }) => slot.startsAt)).not.toContain(
      "2026-05-04T12:00:00.000Z",
    );
  });

  it("creates, reschedules and cancels admin appointments", async () => {
    const created = await request(server)
      .post(`/${ADMIN_CALENDAR_ROUTE}/appointments`)
      .set("Host", tenantHost)
      .set("Cookie", sessionCookie)
      .send({
        serviceId,
        startsAt: "2026-05-04T13:00:00.000Z",
        customerName: "Novo Cliente",
        customerEmail: "novo@example.com",
        customerPhone: "+5511555555555",
      })
      .expect(201);

    expect(created.body).toMatchObject({
      customerName: "Novo Cliente",
      startsAt: "2026-05-04T13:00:00.000Z",
      endsAt: "2026-05-04T14:00:00.000Z",
      status: "confirmed",
    });

    await request(server)
      .post(`/${ADMIN_CALENDAR_ROUTE}/appointments`)
      .set("Host", tenantHost)
      .set("Cookie", sessionCookie)
      .send({
        serviceId,
        startsAt: "2026-05-04T12:00:00.000Z",
        customerName: "Conflito",
        customerEmail: "conflito@example.com",
        customerPhone: "+5511444444444",
      })
      .expect(409);

    const rescheduled = await request(server)
      .post(`/${ADMIN_CALENDAR_ROUTE}/appointments/${appointmentToRescheduleId}/reschedule`)
      .set("Host", tenantHost)
      .set("Cookie", sessionCookie)
      .send({
        startsAt: "2026-05-04T14:00:00.000Z",
      })
      .expect(200);

    expect(rescheduled.body).toMatchObject({
      id: appointmentToRescheduleId,
      startsAt: "2026-05-04T14:00:00.000Z",
      endsAt: "2026-05-04T15:00:00.000Z",
      status: "confirmed",
    });

    const canceled = await request(server)
      .post(`/${ADMIN_CALENDAR_ROUTE}/appointments/${appointmentToCancelId}/cancel`)
      .set("Host", tenantHost)
      .set("Cookie", sessionCookie)
      .expect(200);

    expect(canceled.body).toMatchObject({
      id: appointmentToCancelId,
      status: "canceled",
    });
    expect(canceled.body.canceledAt).toBeTruthy();

    await request(server)
      .post(`/${ADMIN_CALENDAR_ROUTE}/appointments/${appointmentToCancelId}/cancel`)
      .set("Host", tenantHost)
      .set("Cookie", sessionCookie)
      .expect(400);
  });
});

function requireRecord<T>(record: T | undefined): T {
  if (!record) {
    throw new Error("Expected database record");
  }

  return record;
}

class AuthCookieMissingError extends Error {
  constructor() {
    super("Auth cookie missing from sign up response");
    this.name = "AuthCookieMissingError";
  }
}
