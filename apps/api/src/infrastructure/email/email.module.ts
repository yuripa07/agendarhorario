import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { EMAIL_MESSAGE_SENDER } from "./email-message.sender.js";
import { NoopEmailMessageSender } from "./noop-email-message.sender.js";
import { ResendEmailMessageSender } from "./resend-email-message.sender.js";

export function createEmailMessageSender(config: ConfigService) {
  const apiKey = config.get<string>("RESEND_API_KEY");

  if (!apiKey) {
    return new NoopEmailMessageSender();
  }

  return new ResendEmailMessageSender(
    new Resend(apiKey).emails,
    config.getOrThrow<string>("EMAIL_FROM"),
  );
}

@Module({
  providers: [
    {
      provide: EMAIL_MESSAGE_SENDER,
      inject: [ConfigService],
      useFactory: createEmailMessageSender,
    },
  ],
  exports: [EMAIL_MESSAGE_SENDER],
})
export class EmailModule {}
