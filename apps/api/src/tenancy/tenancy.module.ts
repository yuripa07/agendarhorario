import { type MiddlewareConsumer, Module, RequestMethod } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DATABASE,
  type Database,
  DatabaseModule,
} from "../infrastructure/database/database.module.js";
import { TENANT_BRANDING_REPOSITORY } from "./application/tenant-branding.repository.js";
import { TenantBrandingUseCases } from "./application/tenant-branding.use-cases.js";
import { TenantContextService } from "./application/tenant-context.service.js";
import { DrizzleTenantBrandingRepository } from "./infrastructure/drizzle-tenant-branding.repository.js";
import { TenantRepository } from "./infrastructure/tenant.repository.js";
import { AdminTenantBrandingController } from "./presentation/admin-tenant-branding.controller.js";
import { PublicTenantBrandingController } from "./presentation/public-tenant-branding.controller.js";
import { TenantResolutionMiddleware } from "./presentation/tenant-resolution.middleware.js";

@Module({
  imports: [DatabaseModule],
  controllers: [AdminTenantBrandingController, PublicTenantBrandingController],
  providers: [
    TenantContextService,
    {
      provide: TENANT_BRANDING_REPOSITORY,
      inject: [DATABASE],
      useFactory: (database: Database) => new DrizzleTenantBrandingRepository(database),
    },
    {
      provide: TenantBrandingUseCases,
      inject: [TENANT_BRANDING_REPOSITORY],
      useFactory: (repository: DrizzleTenantBrandingRepository) =>
        new TenantBrandingUseCases(repository),
    },
    {
      provide: TenantRepository,
      inject: [DATABASE],
      useFactory: (database: Database) => new TenantRepository(database),
    },
    {
      provide: TenantResolutionMiddleware,
      inject: [ConfigService, TenantContextService, TenantRepository],
      useFactory: (
        config: ConfigService,
        tenantContext: TenantContextService,
        tenantRepository: TenantRepository,
      ) => new TenantResolutionMiddleware(config, tenantContext, tenantRepository),
    },
  ],
  exports: [TenantContextService, TenantRepository],
})
export class TenancyModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantResolutionMiddleware)
      .exclude({ path: "health", method: RequestMethod.GET })
      .forRoutes("*");
  }
}
