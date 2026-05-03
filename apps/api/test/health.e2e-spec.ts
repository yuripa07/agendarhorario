import type { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, describe, it } from "vitest";
import { HealthModule } from "../src/presentation/health/health.module.js";

describe("Health endpoint", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), HealthModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns ok", async () => {
    await request(app.getHttpServer()).get("/health").expect(200).expect("Content-Type", /json/);
  });
});
