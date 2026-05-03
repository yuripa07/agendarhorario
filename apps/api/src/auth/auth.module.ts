import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthModule as BetterAuthModule } from "@thallesp/nestjs-better-auth";
import {
  DATABASE,
  type Database,
  DatabaseModule,
} from "../infrastructure/database/database.module.js";
import {
  PASSWORD_RESET_EMAIL_SENDER,
  type PasswordResetEmailSender,
} from "./application/password-reset-email.sender.js";
import { createAuth } from "./auth.config.js";
import { AUTH_BODY_LIMIT } from "./auth.constants.js";
import { AuthEmailModule } from "./auth-email.module.js";
import { AdminSessionModule } from "./presentation/admin-session.module.js";

@Module({
  imports: [
    DatabaseModule,
    AuthEmailModule,
    AdminSessionModule,
    BetterAuthModule.forRootAsync({
      imports: [DatabaseModule, AuthEmailModule],
      inject: [DATABASE, ConfigService, PASSWORD_RESET_EMAIL_SENDER],
      useFactory: (
        database: Database,
        config: ConfigService,
        passwordResetEmailSender: PasswordResetEmailSender,
      ) => ({
        auth: createAuth(database, config, passwordResetEmailSender),
        bodyParser: {
          json: { limit: AUTH_BODY_LIMIT },
          urlencoded: { limit: AUTH_BODY_LIMIT, extended: true },
        },
      }),
    }),
  ],
  exports: [BetterAuthModule],
})
export class AuthModule {}
