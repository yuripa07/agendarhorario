import { describe, expect, it } from "vitest";
import {
  createPublicBookingSchema,
  managementTokenSchema,
  publicSlotsQuerySchema,
} from "./booking.js";

describe("booking schemas", () => {
  it("accepts public slot windows with UTC instants", () => {
    const parsed = publicSlotsQuerySchema.parse({
      startsAt: "2026-05-04T12:00:00.000Z",
      endsAt: "2026-05-04T18:00:00.000Z",
    });

    expect(parsed.startsAt).toEqual(new Date("2026-05-04T12:00:00.000Z"));
    expect(parsed.endsAt).toEqual(new Date("2026-05-04T18:00:00.000Z"));
  });

  it("rejects non-UTC or inverted public slot windows", () => {
    expect(() =>
      publicSlotsQuerySchema.parse({
        startsAt: "2026-05-04T09:00:00-03:00",
        endsAt: "2026-05-04T10:00:00-03:00",
      }),
    ).toThrow();

    expect(() =>
      publicSlotsQuerySchema.parse({
        startsAt: "2026-05-04T18:00:00.000Z",
        endsAt: "2026-05-04T12:00:00.000Z",
      }),
    ).toThrow();
  });

  it("requires customer contact data and explicit privacy acceptance", () => {
    const parsed = createPublicBookingSchema.parse({
      serviceId: "9ebfd1cf-0374-49fc-98e8-ac9f547c246c",
      startsAt: "2026-05-04T12:00:00.000Z",
      customerName: "Maria Silva",
      customerEmail: "maria@example.com",
      customerPhone: "+5511999999999",
      privacyAccepted: true,
    });

    expect(parsed.customerEmail).toBe("maria@example.com");
    expect(parsed.privacyAccepted).toBe(true);

    expect(() =>
      createPublicBookingSchema.parse({
        ...parsed,
        privacyAccepted: false,
      }),
    ).toThrow();
  });

  it("requires a management token", () => {
    expect(managementTokenSchema.parse({ token: "booking-token" })).toEqual({
      token: "booking-token",
    });

    expect(() => managementTokenSchema.parse({ token: "" })).toThrow();
  });
});
