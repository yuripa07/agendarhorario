import { randomUUID } from "node:crypto";
import type {
  AvailabilityBlock,
  CreateAvailabilityBlockInput,
  WorkingHour,
  WorkingHourInterval,
} from "@agendarhorario/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { AvailabilityBlockNotFoundError } from "../domain/availability.errors.js";
import type { AvailabilityRepository } from "./availability.repository.js";
import { AvailabilityUseCases } from "./availability.use-cases.js";

class InMemoryAvailabilityRepository implements AvailabilityRepository {
  private readonly workingHours = new Map<string, WorkingHour[]>();
  private readonly blocks = new Map<string, AvailabilityBlock>();

  async listWorkingHours(tenantId: string): Promise<readonly WorkingHour[]> {
    return this.workingHours.get(tenantId) ?? [];
  }

  async replaceWorkingHours(
    tenantId: string,
    input: readonly WorkingHourInterval[],
  ): Promise<readonly WorkingHour[]> {
    const now = new Date();
    const workingHours = input.map((workingHour) => ({
      id: randomUUID(),
      tenantId,
      weekday: workingHour.weekday,
      startMinutes: workingHour.startMinutes,
      endMinutes: workingHour.endMinutes,
      isActive: workingHour.isActive,
      createdAt: now,
      updatedAt: now,
    }));
    this.workingHours.set(tenantId, workingHours);
    return workingHours;
  }

  async listBlocks(tenantId: string): Promise<readonly AvailabilityBlock[]> {
    return [...this.blocks.values()].filter((block) => block.tenantId === tenantId);
  }

  async createBlock(
    tenantId: string,
    input: CreateAvailabilityBlockInput,
  ): Promise<AvailabilityBlock> {
    const now = new Date();
    const block = {
      id: randomUUID(),
      tenantId,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      reason: input.reason ?? null,
      createdAt: now,
      updatedAt: now,
    };
    this.blocks.set(block.id, block);
    return block;
  }

  async deleteBlock(tenantId: string, blockId: string): Promise<AvailabilityBlock | undefined> {
    const block = this.blocks.get(blockId);

    if (block?.tenantId !== tenantId) {
      return undefined;
    }

    this.blocks.delete(blockId);
    return block;
  }
}

describe("AvailabilityUseCases", () => {
  let repository: InMemoryAvailabilityRepository;
  let useCases: AvailabilityUseCases;

  beforeEach(() => {
    repository = new InMemoryAvailabilityRepository();
    useCases = new AvailabilityUseCases(repository);
  });

  it("replaces weekly working hours for the current tenant", async () => {
    const tenantId = "00000000-0000-4000-8000-000000000001";

    await useCases.replaceWorkingHours(tenantId, [
      { weekday: 1, startMinutes: 540, endMinutes: 720, isActive: true },
    ]);
    const replacement = await useCases.replaceWorkingHours(tenantId, [
      { weekday: 2, startMinutes: 780, endMinutes: 1080, isActive: true },
    ]);

    expect(replacement).toHaveLength(1);
    expect(await useCases.listWorkingHours(tenantId)).toMatchObject([{ weekday: 2 }]);
  });

  it("lists only availability blocks from the requested tenant", async () => {
    const tenantA = "00000000-0000-4000-8000-000000000001";
    const tenantB = "00000000-0000-4000-8000-000000000002";
    await useCases.createBlock(tenantA, {
      startsAt: new Date("2026-05-04T13:00:00.000Z"),
      endsAt: new Date("2026-05-04T14:00:00.000Z"),
    });
    await useCases.createBlock(tenantB, {
      startsAt: new Date("2026-05-05T13:00:00.000Z"),
      endsAt: new Date("2026-05-05T14:00:00.000Z"),
    });

    const blocks = await useCases.listBlocks(tenantA);

    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.tenantId).toBe(tenantA);
  });

  it("does not delete blocks from another tenant", async () => {
    const block = await useCases.createBlock("00000000-0000-4000-8000-000000000001", {
      startsAt: new Date("2026-05-04T13:00:00.000Z"),
      endsAt: new Date("2026-05-04T14:00:00.000Z"),
    });

    await expect(
      useCases.deleteBlock("00000000-0000-4000-8000-000000000002", block.id),
    ).rejects.toBeInstanceOf(AvailabilityBlockNotFoundError);
  });
});
