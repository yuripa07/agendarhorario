import type {
  BookingManagementLinkSender,
  BookingManagementLinkSenderInput,
} from "../application/booking-management-link.sender.js";

export class NoopBookingManagementLinkSender implements BookingManagementLinkSender {
  readonly sent: BookingManagementLinkSenderInput[] = [];

  send(input: BookingManagementLinkSenderInput): Promise<void> {
    this.sent.push(input);

    return Promise.resolve();
  }
}
