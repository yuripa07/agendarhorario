import { Module } from "@nestjs/common";
import { EmailModule } from "../infrastructure/email/email.module.js";
import {
  EMAIL_MESSAGE_SENDER,
  type EmailMessageSender,
} from "../infrastructure/email/email-message.sender.js";
import { PASSWORD_RESET_EMAIL_SENDER } from "./application/password-reset-email.sender.js";
import { TransactionalPasswordResetEmailSender } from "./infrastructure/transactional-password-reset-email.sender.js";

@Module({
  imports: [EmailModule],
  providers: [
    {
      provide: PASSWORD_RESET_EMAIL_SENDER,
      inject: [EMAIL_MESSAGE_SENDER],
      useFactory: (emailSender: EmailMessageSender) =>
        new TransactionalPasswordResetEmailSender(emailSender),
    },
  ],
  exports: [PASSWORD_RESET_EMAIL_SENDER],
})
export class AuthEmailModule {}
