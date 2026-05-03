import { Test, type TestingModule } from "@nestjs/testing";
import { eq } from "drizzle-orm";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ADMIN_AVAILABILITY_ROUTE } from "../src/availability/availability.constants.js";
import { DATABASE, type Database } from "../src/infrastructure/database/database.module.js";
import { tenants, user } from "../src/infrastructure/database/schema.js";
import { AppModule } from "../src/presentation/app.module.js";

describe("Availability", () => {
  const tenantSlug = `availability-${Date.now()}`;
  const tenantHost = `${tenantSlug}.agendarhorario.com.br`;
  const otherTenantSlug = `availability-other-${Date.now()}`;
  const otherTenantHost = `${otherTenantSlug}.agendarhorario.com.br`;
  const adminEmail = `availability-admin-${Date.now()}@example.com`;
  const adminPassword = "password123";

  let moduleRef: TestingModule;
  let database: Database;
  let server: Parameters<typeof request>[0];
  let sessionCookie: string;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    database = moduleRef.get<Database>(DATABASE);
    server = app.getHttpServer();

    await database.insert(tenants).values([
      {
        slug: tenantSlug,
        displayName: "Availability Tenant",
      },
      {
        slug: otherTenantSlug,
        displayName: "Other Availability Tenant",
      },
    ]);

    const authResponse = await request(server).post("/auth/sign-up/email").send({
      email: adminEmail,
      password: adminPassword,
      name: "Availability Admin",
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

  it("replaces and lists weekly working hours for the current tenant", async () => {
    const replaced = await request(server)
      .put(`/${ADMIN_AVAILABILITY_ROUTE}/working-hours`)
      .set("Host", tenantHost)
      .set("Cookie", sessionCookie)
      .send({
        workingHours: [
          {
            weekday: 1,
            startMinutes: 9 * 60,
            endMinutes: 12 * 60,
          },
          {
            weekday: 1,
            startMinutes: 13 * 60,
            endMinutes: 18 * 60,
          },
        ],
      })
      .expect(200);

    expect(replaced.body).toHaveLength(2);
    expect(replaced.body[0]).toMatchObject({
      weekday: 1,
      startMinutes: 540,
      endMinutes: 720,
      isActive: true,
    });

    const listed = await request(server)
      .get(`/${ADMIN_AVAILABILITY_ROUTE}/working-hours`)
      .set("Host", tenantHost)
      .set("Cookie", sessionCookie)
      .expect(200);

    expect(listed.body).toHaveLength(2);

    const otherTenantListed = await request(server)
      .get(`/${ADMIN_AVAILABILITY_ROUTE}/working-hours`)
      .set("Host", otherTenantHost)
      .set("Cookie", sessionCookie)
      .expect(200);

    expect(otherTenantListed.body).toHaveLength(0);
  });

  it("creates, lists and deletes availability blocks for the current tenant", async () => {
    const created = await request(server)
      .post(`/${ADMIN_AVAILABILITY_ROUTE}/blocks`)
      .set("Host", tenantHost)
      .set("Cookie", sessionCookie)
      .send({
        startsAt: "2026-05-04T13:00:00.000Z",
        endsAt: "2026-05-04T14:00:00.000Z",
        reason: "Almoco",
      })
      .expect(201);

    expect(created.body).toMatchObject({
      startsAt: "2026-05-04T13:00:00.000Z",
      endsAt: "2026-05-04T14:00:00.000Z",
      reason: "Almoco",
    });

    const blockId = created.body.id;

    const listed = await request(server)
      .get(`/${ADMIN_AVAILABILITY_ROUTE}/blocks`)
      .set("Host", tenantHost)
      .set("Cookie", sessionCookie)
      .expect(200);

    expect(listed.body).toHaveLength(1);
    expect(listed.body[0]).toMatchObject({ id: blockId });

    const otherTenantDelete = await request(server)
      .delete(`/${ADMIN_AVAILABILITY_ROUTE}/blocks/${blockId}`)
      .set("Host", otherTenantHost)
      .set("Cookie", sessionCookie)
      .expect(404);

    expect(otherTenantDelete.body.message).toBe("Availability block not found");

    await request(server)
      .delete(`/${ADMIN_AVAILABILITY_ROUTE}/blocks/${blockId}`)
      .set("Host", tenantHost)
      .set("Cookie", sessionCookie)
      .expect(200);

    const afterDelete = await request(server)
      .get(`/${ADMIN_AVAILABILITY_ROUTE}/blocks`)
      .set("Host", tenantHost)
      .set("Cookie", sessionCookie)
      .expect(200);

    expect(afterDelete.body).toHaveLength(0);
  });
});

class AuthCookieMissingError extends Error {
  constructor() {
    super("Auth cookie missing from sign up response");
    this.name = "AuthCookieMissingError";
  }
}
