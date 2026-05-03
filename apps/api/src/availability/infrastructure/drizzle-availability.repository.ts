import type {
  AvailabilityBlock,
  CreateAvailabilityBlockInput,
  WorkingHour,
  WorkingHourInterval,
} from "@agendarhorario/shared";
import { and, asc, eq } from "drizzle-orm";
import type { Database } from "../../infrastructure/database/database.module.js";
import {
  type AvailabilityBlockRecord,
  availabilityBlocks,
  type WorkingHourRecord,
  workingHours,
} from "../../infrastructure/database/schema.js";
import type { AvailabilityRepository } from "../application/availability.repository.js";

export class DrizzleAvailabilityRepository implements AvailabilityRepository {
  constructor(private readonly database: Database) {}

  async listWorkingHours(tenantId: string): Promise<readonly WorkingHour[]> {
    const records = await this.database.query.workingHours.findMany({
      where: eq(workingHours.tenantId, tenantId),
      orderBy: [asc(workingHours.weekday), asc(workingHours.startMinutes)],
    });

    return records.map(mapWorkingHourRecord);
  }

  replaceWorkingHours(
    tenantId: string,
    input: readonly WorkingHourInterval[],
  ): Promise<readonly WorkingHour[]> {
    return this.database.transaction(async (transaction) => {
      await transaction.delete(workingHours).where(eq(workingHours.tenantId, tenantId));

      if (input.length === 0) {
        return [];
      }

      const records = await transaction
        .insert(workingHours)
        .values(
          input.map((workingHour) => ({
            tenantId,
            weekday: workingHour.weekday,
            startMinutes: workingHour.startMinutes,
            endMinutes: workingHour.endMinutes,
            isActive: workingHour.isActive,
          })),
        )
        .returning();

      return records.map(mapWorkingHourRecord);
    });
  }

  async listBlocks(tenantId: string): Promise<readonly AvailabilityBlock[]> {
    const records = await this.database.query.availabilityBlocks.findMany({
      where: eq(availabilityBlocks.tenantId, tenantId),
      orderBy: [asc(availabilityBlocks.startsAt)],
    });

    return records.map(mapAvailabilityBlockRecord);
  }

  async createBlock(
    tenantId: string,
    input: CreateAvailabilityBlockInput,
  ): Promise<AvailabilityBlock> {
    const [block] = await this.database
      .insert(availabilityBlocks)
      .values({
        tenantId,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        reason: input.reason ?? null,
      })
      .returning();

    return mapAvailabilityBlockRecord(requireAvailabilityBlockRecord(block));
  }

  async deleteBlock(tenantId: string, blockId: string): Promise<AvailabilityBlock | undefined> {
    const [block] = await this.database
      .delete(availabilityBlocks)
      .where(and(eq(availabilityBlocks.tenantId, tenantId), eq(availabilityBlocks.id, blockId)))
      .returning();

    return block ? mapAvailabilityBlockRecord(block) : undefined;
  }
}

function mapWorkingHourRecord(record: WorkingHourRecord): WorkingHour {
  return {
    id: record.id,
    tenantId: record.tenantId,
    weekday: record.weekday,
    startMinutes: record.startMinutes,
    endMinutes: record.endMinutes,
    isActive: record.isActive,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function mapAvailabilityBlockRecord(record: AvailabilityBlockRecord): AvailabilityBlock {
  return {
    id: record.id,
    tenantId: record.tenantId,
    startsAt: record.startsAt,
    endsAt: record.endsAt,
    reason: record.reason,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function requireAvailabilityBlockRecord(
  record: AvailabilityBlockRecord | undefined,
): AvailabilityBlockRecord {
  if (!record) {
    throw new AvailabilityPersistenceError();
  }

  return record;
}

class AvailabilityPersistenceError extends Error {
  constructor() {
    super("Availability persistence failed");
    this.name = "AvailabilityPersistenceError";
  }
}
