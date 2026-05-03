import { Module } from "@nestjs/common";
import { PASSWORD_RESET_EMAIL_SENDER } from "./application/password-reset-email.sender.js";
import { NoopPasswordResetEmailSender } from "./infrastructure/noop-password-reset-email.sender.js";

@Module({
  providers: [
    {
      provide: PASSWORD_RESET_EMAIL_SENDER,
      useClass: NoopPasswordResetEmailSender,
    },
  ],
  exports: [PASSWORD_RESET_EMAIL_SENDER],
})
export class AuthEmailModule {}
