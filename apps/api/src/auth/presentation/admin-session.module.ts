import { Module } from "@nestjs/common";
import { TenancyModule } from "../../tenancy/tenancy.module.js";
import { AdminSessionController } from "./admin-session.controller.js";

@Module({
  imports: [TenancyModule],
  controllers: [AdminSessionController],
})
export class AdminSessionModule {}
