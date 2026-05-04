import { Inject, Injectable, type NestMiddleware, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TenantContextService } from "../application/tenant-context.service.js";
import { normalizeHost, resolveTenantSlugFromHost } from "../domain/tenant-host.js";
import { type TenantLookup, TenantRepository } from "../infrastructure/tenant.repository.js";

type TenantResolutionRequest = {
  headers: {
    host?: string;
  };
};

type NextFunction = (error?: unknown) => void;

@Injectable()
export class TenantResolutionMiddleware implements NestMiddleware {
  constructor(
    @Inject(ConfigService)
    private readonly config: ConfigService,

    @Inject(TenantContextService)
    private readonly tenantContext: TenantContextService,

    @Inject(TenantRepository)
    private readonly tenantRepository: TenantLookup,
  ) {}

  async use(
    request: TenantResolutionRequest,
    _response: unknown,
    next: NextFunction,
  ): Promise<void> {
    const slug = resolveTenantSlugFromHost(request.headers.host, {
      rootDomain: this.config.getOrThrow<string>("ROOT_DOMAIN"),
      reservedSubdomains: this.config.getOrThrow<string>("RESERVED_SUBDOMAINS").split(","),
    });

    if (!slug) {
      next();
      return;
    }

    const tenant = await this.tenantRepository.findBySlug(slug);

    if (!tenant) {
      next(new NotFoundException("Tenant not found"));
      return;
    }

    this.tenantContext.run(
      {
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        timezone: tenant.timezone,
        host: normalizeHost(request.headers.host) ?? "",
      },
      next,
    );
  }
}
