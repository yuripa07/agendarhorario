import { describe, expect, it } from "vitest";
import { createAvailabilityBlockSchema, replaceWorkingHoursSchema } from "./availability.js";

describe("availability schemas", () => {
  it("accepts valid weekly working hour intervals", () => {
    const parsed = replaceWorkingHoursSchema.parse({
      workingHours: [
        {
          weekday: 1,
          startMinutes: 9 * 60,
          endMinutes: 12 * 60,
        },
      ],
    });

    expect(parsed.workingHours[0]).toMatchObject({
      weekday: 1,
      startMinutes: 540,
      endMinutes: 720,
      isActive: true,
    });
  });

  it("rejects inverted working hour intervals", () => {
    expect(() =>
      replaceWorkingHoursSchema.parse({
        workingHours: [
          {
            weekday: 1,
            startMinutes: 12 * 60,
            endMinutes: 9 * 60,
          },
        ],
      }),
    ).toThrow();
  });

  it("rejects inverted availability blocks", () => {
    expect(() =>
      createAvailabilityBlockSchema.parse({
        startsAt: "2026-05-04T14:00:00.000Z",
        endsAt: "2026-05-04T13:00:00.000Z",
      }),
    ).toThrow();
  });
});
