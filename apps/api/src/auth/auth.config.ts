import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import type { ConfigService } from "@nestjs/config";
import { betterAuth } from "better-auth";
import type { Database } from "../infrastructure/database/database.module.js";
import * as schema from "../infrastructure/database/schema.js";
import type { PasswordResetEmailSender } from "./application/password-reset-email.sender.js";
import { AUTH_APP_NAME, AUTH_BASE_PATH, AUTH_DATABASE_PROVIDER } from "./auth.constants.js";

export const createAuth = (
  database: Database,
  config: ConfigService,
  passwordResetEmailSender: PasswordResetEmailSender,
) =>
  betterAuth({
    appName: AUTH_APP_NAME,
    baseURL: config.getOrThrow<string>("BETTER_AUTH_URL"),
    basePath: AUTH_BASE_PATH,
    secret: config.getOrThrow<string>("BETTER_AUTH_SECRET"),
    trustedOrigins: [config.getOrThrow<string>("WEB_ORIGIN")],
    database: drizzleAdapter(database, {
      provider: AUTH_DATABASE_PROVIDER,
      schema,
    }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      sendResetPassword: async ({ user, url }) => {
        await passwordResetEmailSender.send({
          to: user.email,
          resetUrl: url,
        });
      },
      resetPasswordTokenExpiresIn: 60 * 60,
    },
  });

export type AppAuth = ReturnType<typeof createAuth>;
