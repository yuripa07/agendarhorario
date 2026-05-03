import { Injectable, Logger } from "@nestjs/common";
import type {
  PasswordResetEmail,
  PasswordResetEmailSender,
} from "../application/password-reset-email.sender.js";

@Injectable()
export class NoopPasswordResetEmailSender implements PasswordResetEmailSender {
  private readonly logger = new Logger(NoopPasswordResetEmailSender.name);

  async send(email: PasswordResetEmail): Promise<void> {
    this.logger.log(`Password reset email stub invoked for ${email.to}`);
  }
}
