import type { EmailMessage, EmailMessageSender } from "./email-message.sender.js";

export class NoopEmailMessageSender implements EmailMessageSender {
  readonly sent: EmailMessage[] = [];

  send(message: EmailMessage): Promise<void> {
    this.sent.push(message);

    return Promise.resolve();
  }
}
