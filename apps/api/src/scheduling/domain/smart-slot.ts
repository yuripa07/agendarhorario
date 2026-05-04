import { addDays, compareAsc } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

export interface SmartSlotWorkingHour {
  readonly weekday: number;
  readonly startMinutes: number;
  readonly endMinutes: number;
  readonly isActive?: boolean;
}

export interface SmartSlotInterval {
  readonly startsAt: Date;
  readonly endsAt: Date;
}

export interface CalculateAvailableSlotsInput {
  readonly tenantTimezone: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly serviceDurationMinutes: number;
  readonly shortestActiveServiceDurationMinutes: number;
  readonly workingHours: readonly SmartSlotWorkingHour[];
  readonly blocks: readonly SmartSlotInterval[];
  readonly appointments: readonly SmartSlotInterval[];
}

export interface AvailableSlot {
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly score: number;
  readonly isAdjacent: boolean;
}

interface UtcWorkingInterval extends SmartSlotInterval {
  readonly sortKey: number;
}

const MINUTES_PER_DAY = 24 * 60;
const ADJACENCY_SORT_PENALTY = 1_000_000_000;
const SMALL_HOLE_PENALTY = 1_000_000;

export function calculateAvailableSlots(input: CalculateAvailableSlotsInput): AvailableSlot[] {
  validateInput(input);

  const serviceDurationMs = minutesToMilliseconds(input.serviceDurationMinutes);
  const shortestServiceMs = minutesToMilliseconds(input.shortestActiveServiceDurationMinutes);
  const busyIntervals = mergeIntervals([...input.blocks, ...input.appointments]);
  const workingIntervals = buildUtcWorkingIntervals(input);
  const slots: AvailableSlot[] = [];

  for (const workingInterval of workingIntervals) {
    for (
      let candidateStartMs = workingInterval.startsAt.getTime();
      candidateStartMs + serviceDurationMs <= workingInterval.endsAt.getTime();
      candidateStartMs += serviceDurationMs
    ) {
      const candidate = {
        startsAt: new Date(candidateStartMs),
        endsAt: new Date(candidateStartMs + serviceDurationMs),
      };

      if (!containsInterval(input, candidate) || overlapsAny(candidate, busyIntervals)) {
        continue;
      }

      const isAdjacent = isAdjacentToAnyAppointment(candidate, input.appointments);
      const operationalWasteMs = calculateOperationalWasteMs(
        candidate,
        workingInterval,
        busyIntervals,
      );
      const smallHoleCount = countSmallOperationalHoles(
        candidate,
        workingInterval,
        busyIntervals,
        shortestServiceMs,
      );

      slots.push({
        ...candidate,
        isAdjacent,
        score:
          (isAdjacent ? 0 : ADJACENCY_SORT_PENALTY) +
          smallHoleCount * SMALL_HOLE_PENALTY +
          Math.floor(operationalWasteMs / 60_000),
      });
    }
  }

  return slots.sort((left, right) => {
    if (left.isAdjacent !== right.isAdjacent) {
      return left.isAdjacent ? -1 : 1;
    }

    if (left.score !== right.score) {
      return left.score - right.score;
    }

    return compareAsc(left.startsAt, right.startsAt);
  });
}

function validateInput(input: CalculateAvailableSlotsInput): void {
  validateInterval(input);
  validatePositiveInteger("serviceDurationMinutes", input.serviceDurationMinutes);
  validatePositiveInteger(
    "shortestActiveServiceDurationMinutes",
    input.shortestActiveServiceDurationMinutes,
  );

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: input.tenantTimezone });
  } catch {
    throw new Error("tenantTimezone must be a valid IANA timezone");
  }

  for (const workingHour of input.workingHours) {
    if (
      !Number.isInteger(workingHour.weekday) ||
      workingHour.weekday < 0 ||
      workingHour.weekday > 6
    ) {
      throw new Error("working hour weekday must be between 0 and 6");
    }

    if (
      !Number.isInteger(workingHour.startMinutes) ||
      !Number.isInteger(workingHour.endMinutes) ||
      workingHour.startMinutes < 0 ||
      workingHour.endMinutes > MINUTES_PER_DAY ||
      workingHour.startMinutes >= workingHour.endMinutes
    ) {
      throw new Error("working hour minutes must be a valid local day interval");
    }
  }

  for (const interval of [...input.blocks, ...input.appointments]) {
    validateInterval(interval);
  }
}

function validatePositiveInteger(name: string, value: number): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
}

function validateInterval(interval: SmartSlotInterval): void {
  if (!(interval.startsAt instanceof Date) || Number.isNaN(interval.startsAt.getTime())) {
    throw new Error("startsAt must be a valid Date");
  }

  if (!(interval.endsAt instanceof Date) || Number.isNaN(interval.endsAt.getTime())) {
    throw new Error("endsAt must be a valid Date");
  }

  if (interval.startsAt >= interval.endsAt) {
    throw new Error("startsAt must be before endsAt");
  }
}

function buildUtcWorkingIntervals(input: CalculateAvailableSlotsInput): UtcWorkingInterval[] {
  const activeWorkingHours = input.workingHours.filter(
    (workingHour) => workingHour.isActive !== false,
  );
  const localStart = toLocalDateStart(addDays(input.startsAt, -1), input.tenantTimezone);
  const localEnd = toLocalDateStart(addDays(input.endsAt, 1), input.tenantTimezone);
  const intervals: UtcWorkingInterval[] = [];

  for (
    let localDate = localStart;
    localDate.getTime() <= localEnd.getTime();
    localDate = addDays(localDate, 1)
  ) {
    const weekday = localDate.getUTCDay();
    const localDateText = formatUtcDate(localDate);

    for (const workingHour of activeWorkingHours) {
      if (workingHour.weekday !== weekday) {
        continue;
      }

      const startsAt = localMinuteToUtc(
        localDateText,
        workingHour.startMinutes,
        input.tenantTimezone,
      );
      const endsAt = localMinuteToUtc(localDateText, workingHour.endMinutes, input.tenantTimezone);

      if (endsAt <= input.startsAt || startsAt >= input.endsAt) {
        continue;
      }

      intervals.push({
        startsAt,
        endsAt,
        sortKey: startsAt.getTime(),
      });
    }
  }

  return intervals.sort((left, right) => left.sortKey - right.sortKey);
}

function toLocalDateStart(date: Date, tenantTimezone: string): Date {
  return parseUtcDate(formatInTimeZone(date, tenantTimezone, "yyyy-MM-dd"));
}

function localMinuteToUtc(localDateText: string, minute: number, tenantTimezone: string): Date {
  const dateText =
    minute === MINUTES_PER_DAY
      ? formatUtcDate(addDays(parseUtcDate(localDateText), 1))
      : localDateText;
  const normalizedMinute = minute % MINUTES_PER_DAY;
  const hours = Math.floor(normalizedMinute / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (normalizedMinute % 60).toString().padStart(2, "0");

  return fromZonedTime(`${dateText}T${hours}:${minutes}:00.000`, tenantTimezone);
}

function formatUtcDate(date: Date): string {
  const year = date.getUTCFullYear().toString().padStart(4, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseUtcDate(dateText: string): Date {
  const [year, month, day] = dateText.split("-").map(Number);

  if (year === undefined || month === undefined || day === undefined) {
    throw new Error("local date must use yyyy-MM-dd");
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function containsInterval(bounds: SmartSlotInterval, interval: SmartSlotInterval): boolean {
  return interval.startsAt >= bounds.startsAt && interval.endsAt <= bounds.endsAt;
}

function overlapsAny(
  interval: SmartSlotInterval,
  intervals: readonly SmartSlotInterval[],
): boolean {
  return intervals.some((current) => overlaps(interval, current));
}

function overlaps(left: SmartSlotInterval, right: SmartSlotInterval): boolean {
  return left.startsAt < right.endsAt && right.startsAt < left.endsAt;
}

function isAdjacentToAnyAppointment(
  slot: SmartSlotInterval,
  appointments: readonly SmartSlotInterval[],
): boolean {
  return appointments.some(
    (appointment) =>
      slot.startsAt.getTime() === appointment.endsAt.getTime() ||
      slot.endsAt.getTime() === appointment.startsAt.getTime(),
  );
}

function calculateOperationalWasteMs(
  slot: SmartSlotInterval,
  workingInterval: SmartSlotInterval,
  busyIntervals: readonly SmartSlotInterval[],
): number {
  const { gapBeforeMs, gapAfterMs } = calculateNeighborGaps(slot, workingInterval, busyIntervals);

  return gapBeforeMs + gapAfterMs;
}

function countSmallOperationalHoles(
  slot: SmartSlotInterval,
  workingInterval: SmartSlotInterval,
  busyIntervals: readonly SmartSlotInterval[],
  shortestServiceMs: number,
): number {
  const { gapBeforeMs, gapAfterMs } = calculateNeighborGaps(slot, workingInterval, busyIntervals);

  return [gapBeforeMs, gapAfterMs].filter((gapMs) => gapMs > 0 && gapMs < shortestServiceMs).length;
}

function calculateNeighborGaps(
  slot: SmartSlotInterval,
  workingInterval: SmartSlotInterval,
  busyIntervals: readonly SmartSlotInterval[],
): { gapBeforeMs: number; gapAfterMs: number } {
  let previousBoundaryMs = workingInterval.startsAt.getTime();
  let nextBoundaryMs = workingInterval.endsAt.getTime();

  for (const busyInterval of busyIntervals) {
    const clippedStartMs = Math.max(
      busyInterval.startsAt.getTime(),
      workingInterval.startsAt.getTime(),
    );
    const clippedEndMs = Math.min(busyInterval.endsAt.getTime(), workingInterval.endsAt.getTime());

    if (clippedStartMs >= clippedEndMs) {
      continue;
    }

    if (clippedEndMs <= slot.startsAt.getTime()) {
      previousBoundaryMs = Math.max(previousBoundaryMs, clippedEndMs);
    }

    if (clippedStartMs >= slot.endsAt.getTime()) {
      nextBoundaryMs = Math.min(nextBoundaryMs, clippedStartMs);
    }
  }

  return {
    gapBeforeMs: slot.startsAt.getTime() - previousBoundaryMs,
    gapAfterMs: nextBoundaryMs - slot.endsAt.getTime(),
  };
}

function mergeIntervals(intervals: readonly SmartSlotInterval[]): SmartSlotInterval[] {
  const sorted = [...intervals].sort((left, right) => compareAsc(left.startsAt, right.startsAt));
  const merged: SmartSlotInterval[] = [];

  for (const interval of sorted) {
    const last = merged.at(-1);

    if (!last || interval.startsAt > last.endsAt) {
      merged.push({ startsAt: interval.startsAt, endsAt: interval.endsAt });
      continue;
    }

    if (interval.endsAt > last.endsAt) {
      merged[merged.length - 1] = {
        startsAt: last.startsAt,
        endsAt: interval.endsAt,
      };
    }
  }

  return merged;
}

function minutesToMilliseconds(minutes: number): number {
  return minutes * 60_000;
}
