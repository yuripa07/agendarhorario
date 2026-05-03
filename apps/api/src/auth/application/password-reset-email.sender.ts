export type PasswordResetEmail = {
  readonly to: string;
  readonly resetUrl: string;
};

export const PASSWORD_RESET_EMAIL_SENDER = Symbol("PASSWORD_RESET_EMAIL_SENDER");

export type PasswordResetEmailSender = {
  send(email: PasswordResetEmail): Promise<void>;
};
