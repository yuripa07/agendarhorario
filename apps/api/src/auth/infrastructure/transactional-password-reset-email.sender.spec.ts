import { describe, expect, it } from "vitest";
import type {
  EmailMessage,
  EmailMessageSender,
} from "../../infrastructure/email/email-message.sender.js";
import { TransactionalPasswordResetEmailSender } from "./transactional-password-reset-email.sender.js";

describe("TransactionalPasswordResetEmailSender", () => {
  it("renders and sends the configured password reset email", async () => {
    const emailSender = new CapturingEmailMessageSender();
    const sender = new TransactionalPasswordResetEmailSender(emailSender);

    await sender.send({
      to: "admin@example.com",
      resetUrl: "https://api.example.com/reset?token=secret-token",
    });

    expect(emailSender.sent[0]).toMatchObject({
      to: "admin@example.com",
      subject: "Redefinicao de senha",
    });
    expect(emailSender.sent[0]?.html).toContain("Redefinir senha");
    expect(emailSender.sent[0]?.text).toContain("https://api.example.com/reset?token=secret-token");
  });
});

class CapturingEmailMessageSender implements EmailMessageSender {
  readonly sent: EmailMessage[] = [];

  send(message: EmailMessage): Promise<void> {
    this.sent.push(message);

    return Promise.resolve();
  }
}
