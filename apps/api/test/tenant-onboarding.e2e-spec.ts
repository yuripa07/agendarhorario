import { Test, type TestingModule } from "@nestjs/testing";
import { eq } from "drizzle-orm";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { DATABASE, type Database } from "../src/infrastructure/database/database.module.js";
import {
  adminTenantMemberships,
  tenantOnboardingInvites,
  tenants,
  user,
} from "../src/infrastructure/database/schema.js";
import { AppModule } from "../src/presentation/app.module.js";
import { ADMIN_SERVICES_ROUTE } from "../src/services/services.constants.js";
import { hashTenantInviteToken } from "../src/tenancy/application/tenant-onboarding.use-cases.js";

describe("Tenant onboarding", () => {
  const tenantSlug = `onboarding-${Date.now()}`;
  const tenantHost = `${tenantSlug}.agendarhorario.com.br`;
  const otherTenantSlug = `onboarding-other-${Date.now()}`;
  const otherTenantHost = `${otherTenantSlug}.agendarhorario.com.br`;
  const adminEmail = `onboarding-admin-${Date.now()}@example.com`;
  const inviteToken = `tenant-onboarding-token-${Date.now()}`;

  let moduleRef: TestingModule;
  let database: Database;
  let server: Parameters<typeof request>[0];
  let tenantId: string;
  let otherTenantId: string;

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
        { slug: tenantSlug, displayName: "Onboarding Tenant" },
        { slug: otherTenantSlug, displayName: "Other Tenant" },
      ])
      .returning();

    tenantId = requireRecord(tenant).id;
    otherTenantId = requireRecord(otherTenant).id;

    await database.insert(tenantOnboardingInvites).values({
      tenantId,
      adminEmail,
      tokenHash: hashTenantInviteToken(inviteToken),
      expiresAt: new Date("2026-06-01T00:00:00.000Z"),
    });
  });

  afterAll(async () => {
    await database?.delete(user).where(eq(user.email, adminEmail));
    await database?.delete(tenants).where(eq(tenants.slug, tenantSlug));
    await database?.delete(tenants).where(eq(tenants.slug, otherTenantSlug));
    await moduleRef?.close();
  });

  it("looks up and accepts a tenant invite", async () => {
    const lookup = await request(server)
      .post("/admin/onboarding/lookup")
      .send({ token: inviteToken })
      .expect(200);

    expect(lookup.body).toMatchObject({
      tenantSlug,
      tenantDisplayName: "Onboarding Tenant",
      adminEmail,
    });
    expect(lookup.body).not.toHaveProperty("tokenHash");

    const accepted = await request(server)
      .post("/admin/onboarding/accept")
      .send({
        token: inviteToken,
        name: "Onboarding Admin",
        password: "password123",
      })
      .expect(201);

    expect(accepted.body).toMatchObject({
      tenantSlug,
      adminEmail,
    });

    const membershipRows = await database
      .select()
      .from(adminTenantMemberships)
      .where(eq(adminTenantMemberships.tenantId, tenantId));

    expect(membershipRows).toHaveLength(1);
  });

  it("enforces tenant membership on admin endpoints", async () => {
    const signIn = await request(server).post("/auth/sign-in/email").send({
      email: adminEmail,
      password: "password123",
    });

    expect(signIn.status).toBe(200);
    expect(signIn.headers["set-cookie"]).toBeDefined();

    const sessionCookie = requireRecord(signIn.headers["set-cookie"]);

    await request(server)
      .get(`/${ADMIN_SERVICES_ROUTE}`)
      .set("Host", tenantHost)
      .set("Cookie", sessionCookie)
      .expect(200);

    await request(server)
      .get(`/${ADMIN_SERVICES_ROUTE}`)
      .set("Host", otherTenantHost)
      .set("Cookie", sessionCookie)
      .expect(403);

    const otherMembershipRows = await database
      .select()
      .from(adminTenantMemberships)
      .where(eq(adminTenantMemberships.tenantId, otherTenantId));

    expect(otherMembershipRows).toHaveLength(0);
  });

  it("rejects reused invites", async () => {
    await request(server)
      .post("/admin/onboarding/accept")
      .send({
        token: inviteToken,
        name: "Onboarding Admin",
        password: "password123",
      })
      .expect(409);
  });
});

function requireRecord<T>(record: T | undefined): T {
  if (!record) {
    throw new Error("Expected record to exist");
  }

  return record;
}
