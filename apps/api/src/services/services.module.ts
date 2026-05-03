import { Module } from "@nestjs/common";
import {
  DATABASE,
  type Database,
  DatabaseModule,
} from "../infrastructure/database/database.module.js";
import { TenancyModule } from "../tenancy/tenancy.module.js";
import { SERVICE_CATALOG_REPOSITORY } from "./application/service-catalog.repository.js";
import { ServiceCatalogUseCases } from "./application/service-catalog.use-cases.js";
import { DrizzleServiceCatalogRepository } from "./infrastructure/drizzle-service-catalog.repository.js";
import { AdminServicesController } from "./presentation/admin-services.controller.js";

@Module({
  imports: [DatabaseModule, TenancyModule],
  controllers: [AdminServicesController],
  providers: [
    ServiceCatalogUseCases,
    {
      provide: SERVICE_CATALOG_REPOSITORY,
      inject: [DATABASE],
      useFactory: (database: Database) => new DrizzleServiceCatalogRepository(database),
    },
  ],
})
export class ServicesModule {}
