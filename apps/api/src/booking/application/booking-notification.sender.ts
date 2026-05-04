export const BOOKING_NOTIFICATION_SENDER = Symbol("BOOKING_NOTIFICATION_SENDER");

export type BookingNotificationAppointment = {
  readonly customerEmail: string;
  readonly customerName: string;
  readonly serviceName?: string;
  readonly startsAt: Date;
  readonly timezone: string;
};

export type BookingCreatedNotification = BookingNotificationAppointment & {
  readonly token: string;
};

export type BookingNotificationSender = {
  bookingCreated(input: BookingCreatedNotification): Promise<void>;
  bookingCanceled(input: BookingNotificationAppointment): Promise<void>;
  bookingRescheduled(input: BookingNotificationAppointment): Promise<void>;
};
