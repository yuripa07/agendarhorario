import type {
  AvailabilityBlock,
  CreateAvailabilityBlockInput,
  WorkingHour,
  WorkingHourInterval,
} from "@agendarhorario/shared";
import { Inject, Injectable } from "@nestjs/common";
import { AvailabilityBlockNotFoundError } from "../domain/availability.errors.js";
import { AVAILABILITY_REPOSITORY, type AvailabilityRepository } from "./availability.repository.js";

@Injectable()
export class AvailabilityUseCases {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly repository: AvailabilityRepository,
  ) {}

  listWorkingHours(tenantId: string): Promise<readonly WorkingHour[]> {
    return this.repository.listWorkingHours(tenantId);
  }

  replaceWorkingHours(
    tenantId: string,
    workingHours: readonly WorkingHourInterval[],
  ): Promise<readonly WorkingHour[]> {
    return this.repository.replaceWorkingHours(tenantId, workingHours);
  }

  listBlocks(tenantId: string): Promise<readonly AvailabilityBlock[]> {
    return this.repository.listBlocks(tenantId);
  }

  createBlock(tenantId: string, input: CreateAvailabilityBlockInput): Promise<AvailabilityBlock> {
    return this.repository.createBlock(tenantId, input);
  }

  async deleteBlock(tenantId: string, blockId: string): Promise<AvailabilityBlock> {
    const block = await this.repository.deleteBlock(tenantId, blockId);

    if (!block) {
      throw new AvailabilityBlockNotFoundError();
    }

    return block;
  }
}
