import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, it } from "vitest";
import { ADMIN_SESSION_ROUTE } from "../src/auth/auth.constants.js";
import { ADMIN_AVAILABILITY_ROUTE } from "../src/availability/availability.constants.js";
import { AppModule } from "../src/presentation/app.module.js";
import { ADMIN_SERVICES_ROUTE } from "../src/services/services.constants.js";

describe("Admin auth", () => {
  let moduleRef: TestingModule;
  let server: Parameters<typeof request>[0];

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const app = moduleRef.createNestApplication();
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await moduleRef?.close();
  });

  it("keeps health public", async () => {
    await request(server).get("/health").expect(200);
  });

  it("rejects anonymous admin session requests", async () => {
    await request(server).get(`/${ADMIN_SESSION_ROUTE}`).expect(401);
  });

  it("rejects anonymous service catalog requests", async () => {
    await request(server).get(`/${ADMIN_SERVICES_ROUTE}`).expect(401);
  });

  it("rejects anonymous availability requests", async () => {
    await request(server).get(`/${ADMIN_AVAILABILITY_ROUTE}/working-hours`).expect(401);
  });
});
