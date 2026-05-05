export const EMAIL_MESSAGE_SENDER = Symbol("EMAIL_MESSAGE_SENDER");

export type EmailMessage = {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
};

export type EmailMessageSender = {
  send(message: EmailMessage): Promise<void>;
};
