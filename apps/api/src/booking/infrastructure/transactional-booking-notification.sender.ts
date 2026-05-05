import type { ConfigService } from "@nestjs/config";
import type { EmailMessageSender } from "../../infrastructure/email/email-message.sender.js";
import { renderEmailTemplate } from "../../infrastructure/email/email-template.renderer.js";
import {
  bookingCanceledEmail,
  bookingCreatedEmail,
  bookingRescheduledEmail,
} from "../../infrastructure/email/transactional-email.templates.js";
import type { BookingNotificationSender } from "../application/booking-notification.sender.js";

type Template = ReturnType<
  typeof bookingCreatedEmail | typeof bookingCanceledEmail | typeof bookingRescheduledEmail
>;

export class TransactionalBookingNotificationSender implements BookingNotificationSender {
  constructor(
    private readonly emailSender: EmailMessageSender,
    private readonly config: ConfigService,
  ) {}

  async bookingCreated(input: Parameters<BookingNotificationSender["bookingCreated"]>[0]) {
    await this.send(
      input.customerEmail,
      bookingCreatedEmail({
        ...input,
        managementUrl: this.managementUrl(input.token),
      }),
    );
  }

  async bookingCanceled(input: Parameters<BookingNotificationSender["bookingCanceled"]>[0]) {
    await this.send(input.customerEmail, bookingCanceledEmail(input));
  }

  async bookingRescheduled(input: Parameters<BookingNotificationSender["bookingRescheduled"]>[0]) {
    await this.send(input.customerEmail, bookingRescheduledEmail(input));
  }

  private async send(to: string, template: Template): Promise<void> {
    const rendered = await renderEmailTemplate(template.subject, template.node);

    await this.emailSender.send({ to, ...rendered });
  }

  private managementUrl(token: string): string {
    const url = new URL("/booking/manage", this.config.getOrThrow<string>("WEB_ORIGIN"));
    url.searchParams.set("token", token);

    return url.toString();
  }
}
