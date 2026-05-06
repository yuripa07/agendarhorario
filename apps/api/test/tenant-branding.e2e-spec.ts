import { Test, type TestingModule } from "@nestjs/testing";
import { eq } from "drizzle-orm";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DATABASE, type Database } from "../src/infrastructure/database/database.module.js";
import { adminTenantMemberships, tenants, user } from "../src/infrastructure/database/schema.js";
import { AppModule } from "../src/presentation/app.module.js";

describe("Tenant branding API", () => {
  const tenantSlug = `branding-${Date.now()}`;
  const tenantHost = `${tenantSlug}.agendarhorario.com.br`;
  const otherTenantSlug = `branding-other-${Date.now()}`;
  const otherTenantHost = `${otherTenantSlug}.agendarhorario.com.br`;
  const adminEmail = `branding-admin-${Date.now()}@example.com`;
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

    const [tenant] = await database
      .insert(tenants)
      .values([
        {
          slug: tenantSlug,
          displayName: "Branding Tenant",
          primaryColor: "#2563eb",
        },
        {
          slug: otherTenantSlug,
          displayName: "Other Branding Tenant",
          primaryColor: "#16a34a",
        },
      ])
      .returning();

    const authResponse = await request(server).post("/auth/sign-up/email").send({
      email: adminEmail,
      password: adminPassword,
      name: "Branding Admin",
    });

    expect(authResponse.status).toBe(200);
    expect(authResponse.headers["set-cookie"]).toBeDefined();

    const setCookie = authResponse.headers["set-cookie"];

    if (!setCookie) {
      throw new AuthCookieMissingError();
    }

    await database.insert(adminTenantMemberships).values({
      tenantId: requireRecord(tenant).id,
      userId: authResponse.body.user.id,
    });

    sessionCookie = setCookie;
  });

  afterAll(async () => {
    await database?.delete(user).where(eq(user.email, adminEmail));
    await database?.delete(tenants).where(eq(tenants.slug, tenantSlug));
    await database?.delete(tenants).where(eq(tenants.slug, otherTenantSlug));
    await moduleRef?.close();
  });

  it("gets and updates tenant branding for authenticated admins", async () => {
    await request(server).get("/admin/tenant/branding").set("Host", tenantHost).expect(401);

    const current = await request(server)
      .get("/admin/tenant/branding")
      .set("Host", tenantHost)
      .set("Cookie", sessionCookie)
      .expect(200);

    expect(current.body).toEqual({
      displayName: "Branding Tenant",
      primaryColor: "#2563eb",
    });

    await request(server)
      .patch("/admin/tenant/branding")
      .set("Host", tenantHost)
      .set("Cookie", sessionCookie)
      .send({
        displayName: "Studio Azul",
        primaryColor: "2563eb",
      })
      .expect(400);

    const updated = await request(server)
      .patch("/admin/tenant/branding")
      .set("Host", tenantHost)
      .set("Cookie", sessionCookie)
      .send({
        displayName: "Studio Azul",
        primaryColor: "#0f172a",
      })
      .expect(200);

    expect(updated.body).toEqual({
      displayName: "Studio Azul",
      primaryColor: "#0f172a",
    });
  });

  it("returns public branding by host and preserves tenant isolation", async () => {
    const current = await request(server)
      .get("/public/tenant/branding")
      .set("Host", tenantHost)
      .expect(200);

    expect(current.body).toEqual({
      displayName: "Studio Azul",
      primaryColor: "#0f172a",
    });

    const otherTenant = await request(server)
      .get("/public/tenant/branding")
      .set("Host", otherTenantHost)
      .expect(200);

    expect(otherTenant.body).toEqual({
      displayName: "Other Branding Tenant",
      primaryColor: "#16a34a",
    });
  });
});

class AuthCookieMissingError extends Error {
  constructor() {
    super("Auth cookie missing from sign up response");
    this.name = "AuthCookieMissingError";
  }
}

function requireRecord<T>(record: T | undefined): T {
  if (!record) {
    throw new Error("Expected record to exist");
  }

  return record;
}
