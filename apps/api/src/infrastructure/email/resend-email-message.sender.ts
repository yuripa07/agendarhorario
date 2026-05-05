import type { EmailMessage, EmailMessageSender } from "./email-message.sender.js";

export type ResendEmailsClient = {
  send(input: {
    from: string;
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<unknown>;
};

export class ResendEmailMessageSender implements EmailMessageSender {
  constructor(
    private readonly emails: ResendEmailsClient,
    private readonly from: string,
  ) {}

  async send(message: EmailMessage): Promise<void> {
    await this.emails.send({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  }
}
