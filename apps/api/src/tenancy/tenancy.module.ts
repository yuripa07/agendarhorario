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
import { TENANT_ONBOARDING_REPOSITORY } from "./application/tenant-onboarding.repository.js";
import { TenantOnboardingUseCases } from "./application/tenant-onboarding.use-cases.js";
import { DrizzleTenantBrandingRepository } from "./infrastructure/drizzle-tenant-branding.repository.js";
import { DrizzleTenantOnboardingAuth } from "./infrastructure/drizzle-tenant-onboarding.auth.js";
import { DrizzleTenantOnboardingRepository } from "./infrastructure/drizzle-tenant-onboarding.repository.js";
import { TenantRepository } from "./infrastructure/tenant.repository.js";
import { AdminOnboardingController } from "./presentation/admin-onboarding.controller.js";
import { AdminTenantBrandingController } from "./presentation/admin-tenant-branding.controller.js";
import { AdminTenantMembershipGuard } from "./presentation/admin-tenant-membership.guard.js";
import { PublicTenantBrandingController } from "./presentation/public-tenant-branding.controller.js";
import { TenantResolutionMiddleware } from "./presentation/tenant-resolution.middleware.js";

@Module({
  imports: [DatabaseModule],
  controllers: [
    AdminOnboardingController,
    AdminTenantBrandingController,
    PublicTenantBrandingController,
  ],
  providers: [
    TenantContextService,
    {
      provide: DrizzleTenantOnboardingAuth,
      inject: [DATABASE],
      useFactory: (database: Database) => new DrizzleTenantOnboardingAuth(database),
    },
    {
      provide: TENANT_BRANDING_REPOSITORY,
      inject: [DATABASE],
      useFactory: (database: Database) => new DrizzleTenantBrandingRepository(database),
    },
    {
      provide: TENANT_ONBOARDING_REPOSITORY,
      inject: [DATABASE],
      useFactory: (database: Database) => new DrizzleTenantOnboardingRepository(database),
    },
    {
      provide: TenantBrandingUseCases,
      inject: [TENANT_BRANDING_REPOSITORY],
      useFactory: (repository: DrizzleTenantBrandingRepository) =>
        new TenantBrandingUseCases(repository),
    },
    {
      provide: TenantOnboardingUseCases,
      inject: [TENANT_ONBOARDING_REPOSITORY, DrizzleTenantOnboardingAuth],
      useFactory: (
        repository: DrizzleTenantOnboardingRepository,
        auth: DrizzleTenantOnboardingAuth,
      ) => new TenantOnboardingUseCases(repository, auth),
    },
    AdminTenantMembershipGuard,
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
  exports: [
    TenantContextService,
    TenantRepository,
    TENANT_ONBOARDING_REPOSITORY,
    AdminTenantMembershipGuard,
  ],
})
export class TenancyModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantResolutionMiddleware)
      .exclude({ path: "health", method: RequestMethod.GET })
      .forRoutes("*");
  }
}
