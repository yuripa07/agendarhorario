import { Controller, Get } from "@nestjs/common";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import type { AppAuth } from "../auth.config.js";
import { ADMIN_SESSION_ROUTE } from "../auth.constants.js";

@Controller(ADMIN_SESSION_ROUTE)
export class AdminSessionController {
  @Get()
  getSession(@Session() session: UserSession<AppAuth>): UserSession<AppAuth> {
    return session;
  }
}
