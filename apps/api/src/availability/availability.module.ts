import { Module } from "@nestjs/common";
import {
  DATABASE,
  type Database,
  DatabaseModule,
} from "../infrastructure/database/database.module.js";
import { TenancyModule } from "../tenancy/tenancy.module.js";
import { AVAILABILITY_REPOSITORY } from "./application/availability.repository.js";
import { AvailabilityUseCases } from "./application/availability.use-cases.js";
import { DrizzleAvailabilityRepository } from "./infrastructure/drizzle-availability.repository.js";
import { AdminAvailabilityController } from "./presentation/admin-availability.controller.js";

@Module({
  imports: [DatabaseModule, TenancyModule],
  controllers: [AdminAvailabilityController],
  providers: [
    AvailabilityUseCases,
    {
      provide: AVAILABILITY_REPOSITORY,
      inject: [DATABASE],
      useFactory: (database: Database) => new DrizzleAvailabilityRepository(database),
    },
  ],
})
export class AvailabilityModule {}
