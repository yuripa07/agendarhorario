export const BOOKING_MANAGEMENT_LINK_SENDER = Symbol("BOOKING_MANAGEMENT_LINK_SENDER");

export type BookingManagementLinkSenderInput = {
  customerEmail: string;
  customerName: string;
  appointmentId: string;
  token: string;
};

export interface BookingManagementLinkSender {
  send(input: BookingManagementLinkSenderInput): Promise<void>;
}
