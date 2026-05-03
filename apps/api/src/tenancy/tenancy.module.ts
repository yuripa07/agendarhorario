import { type MiddlewareConsumer, Module, RequestMethod } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DATABASE,
  type Database,
  DatabaseModule,
} from "../infrastructure/database/database.module.js";
import { TenantContextService } from "./application/tenant-context.service.js";
import { TenantRepository } from "./infrastructure/tenant.repository.js";
import { TenantResolutionMiddleware } from "./presentation/tenant-resolution.middleware.js";

@Module({
  imports: [DatabaseModule],
  providers: [
    TenantContextService,
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
