import { Test, type TestingModule } from "@nestjs/testing";
import { eq } from "drizzle-orm";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DATABASE, type Database } from "../src/infrastructure/database/database.module.js";
import { tenants, user } from "../src/infrastructure/database/schema.js";
import { AppModule } from "../src/presentation/app.module.js";
import { ADMIN_SERVICES_ROUTE } from "../src/services/services.constants.js";

describe("Service catalog", () => {
  const tenantSlug = `catalog-${Date.now()}`;
  const tenantHost = `${tenantSlug}.agendarhorario.com.br`;
  const adminEmail = `admin-${Date.now()}@example.com`;
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

    await database.insert(tenants).values({
      slug: tenantSlug,
      displayName: "Catalog Tenant",
    });

    const authResponse = await request(server).post("/auth/sign-up/email").send({
      email: adminEmail,
      password: adminPassword,
      name: "Catalog Admin",
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
    await moduleRef?.close();
  });

  it("creates, lists, updates and deactivates tenant services", async () => {
    const created = await request(server)
      .post(`/${ADMIN_SERVICES_ROUTE}`)
      .set("Host", tenantHost)
      .set("Cookie", sessionCookie)
      .send({
        name: "Corte masculino",
        durationMinutes: 45,
        priceCents: 5000,
      })
      .expect(201);

    expect(created.body).toMatchObject({
      name: "Corte masculino",
      durationMinutes: 45,
      priceCents: 5000,
      isActive: true,
    });

    const serviceId = created.body.id;

    const listed = await request(server)
      .get(`/${ADMIN_SERVICES_ROUTE}`)
      .set("Host", tenantHost)
      .set("Cookie", sessionCookie)
      .expect(200);

    expect(listed.body).toHaveLength(1);
    expect(listed.body[0]).toMatchObject({ id: serviceId });

    const updated = await request(server)
      .patch(`/${ADMIN_SERVICES_ROUTE}/${serviceId}`)
      .set("Host", tenantHost)
      .set("Cookie", sessionCookie)
      .send({ priceCents: 5500 })
      .expect(200);

    expect(updated.body.priceCents).toBe(5500);

    const deactivated = await request(server)
      .delete(`/${ADMIN_SERVICES_ROUTE}/${serviceId}`)
      .set("Host", tenantHost)
      .set("Cookie", sessionCookie)
      .expect(200);

    expect(deactivated.body.isActive).toBe(false);
  });
});

class AuthCookieMissingError extends Error {
  constructor() {
    super("Auth cookie missing from sign up response");
    this.name = "AuthCookieMissingError";
  }
}
