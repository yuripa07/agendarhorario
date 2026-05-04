import { ConfigService } from "@nestjs/config";
import { describe, expect, it } from "vitest";
import { createEmailMessageSender } from "./email.module.js";
import { NoopEmailMessageSender } from "./noop-email-message.sender.js";
import { ResendEmailMessageSender } from "./resend-email-message.sender.js";

describe("createEmailMessageSender", () => {
  it("uses noop sender when RESEND_API_KEY is not configured", () => {
    const sender = createEmailMessageSender(new ConfigService({ EMAIL_FROM: "dev@example.com" }));

    expect(sender).toBeInstanceOf(NoopEmailMessageSender);
  });

  it("uses Resend sender when RESEND_API_KEY exists", () => {
    const sender = createEmailMessageSender(
      new ConfigService({
        RESEND_API_KEY: "re_test_key",
        EMAIL_FROM: "Agendar <no-reply@example.com>",
      }),
    );

    expect(sender).toBeInstanceOf(ResendEmailMessageSender);
  });
});
