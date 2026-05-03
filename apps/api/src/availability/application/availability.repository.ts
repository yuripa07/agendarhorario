import type {
  AvailabilityBlock,
  CreateAvailabilityBlockInput,
  WorkingHour,
  WorkingHourInterval,
} from "@agendarhorario/shared";

export type AvailabilityRepository = {
  listWorkingHours(tenantId: string): Promise<readonly WorkingHour[]>;
  replaceWorkingHours(
    tenantId: string,
    workingHours: readonly WorkingHourInterval[],
  ): Promise<readonly WorkingHour[]>;
  listBlocks(tenantId: string): Promise<readonly AvailabilityBlock[]>;
  createBlock(tenantId: string, input: CreateAvailabilityBlockInput): Promise<AvailabilityBlock>;
  deleteBlock(tenantId: string, blockId: string): Promise<AvailabilityBlock | undefined>;
};

export const AVAILABILITY_REPOSITORY = Symbol("AVAILABILITY_REPOSITORY");
