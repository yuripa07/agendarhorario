import { Controller, Get, UseGuards } from "@nestjs/common";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import { AdminTenantMembershipGuard } from "../../tenancy/presentation/admin-tenant-membership.guard.js";
import type { AppAuth } from "../auth.config.js";
import { ADMIN_SESSION_ROUTE } from "../auth.constants.js";

@Controller(ADMIN_SESSION_ROUTE)
@UseGuards(AdminTenantMembershipGuard)
export class AdminSessionController {
  @Get()
  getSession(@Session() session: UserSession<AppAuth>): UserSession<AppAuth> {
    return session;
  }
}
