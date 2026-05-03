import { Module } from "@nestjs/common";
import { AdminSessionController } from "./admin-session.controller.js";

@Module({
  controllers: [AdminSessionController],
})
export class AdminSessionModule {}
