import type { EmailMessageSender } from "../../infrastructure/email/email-message.sender.js";
import { renderEmailTemplate } from "../../infrastructure/email/email-template.renderer.js";
import { passwordResetEmail } from "../../infrastructure/email/transactional-email.templates.js";
import type {
  PasswordResetEmail,
  PasswordResetEmailSender,
} from "../application/password-reset-email.sender.js";

export class TransactionalPasswordResetEmailSender implements PasswordResetEmailSender {
  constructor(private readonly emailSender: EmailMessageSender) {}

  async send(email: PasswordResetEmail): Promise<void> {
    const template = passwordResetEmail({ resetUrl: email.resetUrl });
    const rendered = await renderEmailTemplate(template.subject, template.node);

    await this.emailSender.send({
      to: email.to,
      ...rendered,
    });
  }
}
