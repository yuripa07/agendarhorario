import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import type { AppAuth } from "../../auth/auth.config.js";
import { TenantContextService } from "../application/tenant-context.service.js";
import {
  TENANT_ONBOARDING_REPOSITORY,
  type TenantOnboardingRepository,
} from "../application/tenant-onboarding.repository.js";

type RequestWithSession = {
  session?: AppAuth["$Infer"]["Session"] | null;
};

@Injectable()
export class AdminTenantMembershipGuard implements CanActivate {
  constructor(
    @Inject(TenantContextService)
    private readonly tenantContext: TenantContextService,

    @Inject(TENANT_ONBOARDING_REPOSITORY)
    private readonly repository: TenantOnboardingRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithSession>();
    const session = request.session;

    if (!session) {
      return true;
    }

    const tenant = this.tenantContext.getContext();

    if (!tenant) {
      throw new ForbiddenException("Tenant context is required");
    }

    const allowed = await this.repository.hasAdminMembership({
      tenantId: tenant.tenantId,
      userId: session.user.id,
    });

    if (!allowed) {
      throw new ForbiddenException("Admin user does not belong to tenant");
    }

    return true;
  }
}
