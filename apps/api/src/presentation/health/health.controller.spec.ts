import { describe, expect, it } from "vitest";
import { HealthController } from "./health.controller.js";

describe("HealthController", () => {
  it("returns an ok health payload", () => {
    const response = new HealthController().getHealth();

    expect(response.status).toBe("ok");
    expect(response.service).toBe("api");
    expect(new Date(response.timestamp).toISOString()).toBe(response.timestamp);
  });
});
