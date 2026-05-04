import { describe, expect, it } from "vitest";
import {
  type CalculateAvailableSlotsInput,
  calculateAvailableSlots,
  type SmartSlotInterval,
  type SmartSlotWorkingHour,
} from "./smart-slot.js";

const saoPauloTimezone = "America/Sao_Paulo";

describe("calculateAvailableSlots", () => {
  it("returns slots for an empty schedule with simple working hours", () => {
    const slots = calculateAvailableSlots(
      input({
        workingHours: [workingHour(1, "09:00", "11:00")],
        serviceDurationMinutes: 60,
        startsAt: date("2026-05-04T00:00:00.000Z"),
        endsAt: date("2026-05-05T00:00:00.000Z"),
      }),
    );

    expect(slotStarts(slots)).toEqual(["2026-05-04T12:00:00.000Z", "2026-05-04T13:00:00.000Z"]);
    expect(slots).toEqual([
      expect.objectContaining({
        endsAt: date("2026-05-04T13:00:00.000Z"),
        isAdjacent: false,
      }),
      expect.objectContaining({
        endsAt: date("2026-05-04T14:00:00.000Z"),
        isAdjacent: false,
      }),
    ]);
  });

  it("supports multiple working intervals on the same local day", () => {
    const slots = calculateAvailableSlots(
      input({
        workingHours: [workingHour(1, "09:00", "10:00"), workingHour(1, "14:00", "15:00")],
        serviceDurationMinutes: 30,
      }),
    );

    expect(slotStarts(slots)).toEqual([
      "2026-05-04T12:00:00.000Z",
      "2026-05-04T12:30:00.000Z",
      "2026-05-04T17:00:00.000Z",
      "2026-05-04T17:30:00.000Z",
    ]);
  });

  it("removes slots that collide with blocks", () => {
    const slots = calculateAvailableSlots(
      input({
        workingHours: [workingHour(1, "09:00", "11:00")],
        serviceDurationMinutes: 30,
        blocks: [interval("2026-05-04T12:30:00.000Z", "2026-05-04T13:00:00.000Z")],
      }),
    );

    expect(slotStarts(slots)).toEqual([
      "2026-05-04T12:00:00.000Z",
      "2026-05-04T13:00:00.000Z",
      "2026-05-04T13:30:00.000Z",
    ]);
  });

  it("removes slots that collide with existing appointments", () => {
    const slots = calculateAvailableSlots(
      input({
        workingHours: [workingHour(1, "09:00", "11:00")],
        serviceDurationMinutes: 30,
        appointments: [interval("2026-05-04T13:00:00.000Z", "2026-05-04T13:30:00.000Z")],
      }),
    );

    expect(slotStarts(slots)).toEqual([
      "2026-05-04T13:30:00.000Z",
      "2026-05-04T12:30:00.000Z",
      "2026-05-04T12:00:00.000Z",
    ]);
  });

  it("marks and prioritizes slots adjacent before and after appointments", () => {
    const slots = calculateAvailableSlots(
      input({
        workingHours: [workingHour(1, "09:00", "12:00")],
        serviceDurationMinutes: 30,
        appointments: [interval("2026-05-04T13:00:00.000Z", "2026-05-04T13:30:00.000Z")],
      }),
    );

    expect(slots.slice(0, 2)).toEqual([
      expect.objectContaining({
        startsAt: date("2026-05-04T12:30:00.000Z"),
        isAdjacent: true,
      }),
      expect.objectContaining({
        startsAt: date("2026-05-04T13:30:00.000Z"),
        isAdjacent: true,
      }),
    ]);
    expect(slots.slice(2).every((slot) => !slot.isAdjacent)).toBe(true);
  });

  it("sorts by score and then by start time", () => {
    const slots = calculateAvailableSlots(
      input({
        workingHours: [workingHour(1, "09:00", "11:00")],
        serviceDurationMinutes: 60,
        shortestActiveServiceDurationMinutes: 30,
      }),
    );

    expect(
      slots.map((slot) => ({ startsAt: slot.startsAt.toISOString(), score: slot.score })),
    ).toEqual([
      { startsAt: "2026-05-04T12:00:00.000Z", score: 1_000_000_060 },
      { startsAt: "2026-05-04T13:00:00.000Z", score: 1_000_000_060 },
    ]);
  });

  it("penalizes slots that leave holes smaller than the shortest active service", () => {
    const slots = calculateAvailableSlots(
      input({
        workingHours: [workingHour(1, "09:00", "12:00"), workingHour(1, "13:00", "15:00")],
        serviceDurationMinutes: 60,
        shortestActiveServiceDurationMinutes: 60,
        blocks: [interval("2026-05-04T13:45:00.000Z", "2026-05-04T15:00:00.000Z")],
      }),
    );

    expect(slotStarts(slots).slice(0, 2)).toEqual([
      "2026-05-04T16:00:00.000Z",
      "2026-05-04T17:00:00.000Z",
    ]);
    expect(slots.at(-1)).toEqual(
      expect.objectContaining({
        startsAt: date("2026-05-04T12:00:00.000Z"),
        score: 1_001_000_045,
      }),
    );
  });

  it("uses the tenant timezone when converting local working hours", () => {
    const slots = calculateAvailableSlots(
      input({
        tenantTimezone: saoPauloTimezone,
        workingHours: [workingHour(1, "09:00", "10:00")],
        serviceDurationMinutes: 30,
      }),
    );

    expect(slotStarts(slots)).toEqual(["2026-05-04T12:00:00.000Z", "2026-05-04T12:30:00.000Z"]);
  });

  it("handles local day transitions and UTC search windows", () => {
    const slots = calculateAvailableSlots(
      input({
        startsAt: date("2026-05-04T02:00:00.000Z"),
        endsAt: date("2026-05-04T04:00:00.000Z"),
        workingHours: [workingHour(0, "23:30", "24:00"), workingHour(1, "00:00", "01:00")],
        serviceDurationMinutes: 30,
      }),
    );

    expect(slotStarts(slots)).toEqual([
      "2026-05-04T02:30:00.000Z",
      "2026-05-04T03:00:00.000Z",
      "2026-05-04T03:30:00.000Z",
    ]);
  });
});

function input(overrides: Partial<CalculateAvailableSlotsInput>): CalculateAvailableSlotsInput {
  return {
    tenantTimezone: saoPauloTimezone,
    startsAt: date("2026-05-04T00:00:00.000Z"),
    endsAt: date("2026-05-05T00:00:00.000Z"),
    serviceDurationMinutes: 30,
    shortestActiveServiceDurationMinutes: 30,
    workingHours: [],
    blocks: [],
    appointments: [],
    ...overrides,
  };
}

function workingHour(weekday: number, startsAt: string, endsAt: string): SmartSlotWorkingHour {
  return {
    weekday,
    startMinutes: toMinutes(startsAt),
    endMinutes: toMinutes(endsAt),
  };
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);

  if (hours === undefined || minutes === undefined) {
    throw new Error("time must use HH:mm");
  }

  return hours * 60 + minutes;
}

function interval(startsAt: string, endsAt: string): SmartSlotInterval {
  return {
    startsAt: date(startsAt),
    endsAt: date(endsAt),
  };
}

function date(value: string): Date {
  return new Date(value);
}

function slotStarts(slots: readonly SmartSlotInterval[]): string[] {
  return slots.map((slot) => slot.startsAt.toISOString());
}
