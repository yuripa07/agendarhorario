import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DATABASE,
  type Database,
  DatabaseModule,
} from "../infrastructure/database/database.module.js";
import { EmailModule } from "../infrastructure/email/email.module.js";
import {
  EMAIL_MESSAGE_SENDER,
  type EmailMessageSender,
} from "../infrastructure/email/email-message.sender.js";
import { TenancyModule } from "../tenancy/tenancy.module.js";
import { ADMIN_CALENDAR_REPOSITORY } from "./application/admin-calendar.repository.js";
import { AdminCalendarUseCases } from "./application/admin-calendar.use-cases.js";
import {
  BOOKING_NOTIFICATION_SENDER,
  type BookingNotificationSender,
} from "./application/booking-notification.sender.js";
import { PUBLIC_BOOKING_REPOSITORY } from "./application/public-booking.repository.js";
import { PublicBookingUseCases } from "./application/public-booking.use-cases.js";
import { DrizzleAdminCalendarRepository } from "./infrastructure/drizzle-admin-calendar.repository.js";
import { DrizzlePublicBookingRepository } from "./infrastructure/drizzle-public-booking.repository.js";
import { TransactionalBookingNotificationSender } from "./infrastructure/transactional-booking-notification.sender.js";
import { AdminCalendarController } from "./presentation/admin-calendar.controller.js";
import { PublicBookingController } from "./presentation/public-booking.controller.js";

@Module({
  imports: [DatabaseModule, EmailModule, TenancyModule],
  controllers: [PublicBookingController, AdminCalendarController],
  providers: [
    {
      provide: ADMIN_CALENDAR_REPOSITORY,
      inject: [DATABASE],
      useFactory: (database: Database) => new DrizzleAdminCalendarRepository(database),
    },
    {
      provide: PUBLIC_BOOKING_REPOSITORY,
      inject: [DATABASE],
      useFactory: (database: Database) => new DrizzlePublicBookingRepository(database),
    },
    {
      provide: BOOKING_NOTIFICATION_SENDER,
      inject: [EMAIL_MESSAGE_SENDER, ConfigService],
      useFactory: (emailSender: EmailMessageSender, config: ConfigService) =>
        new TransactionalBookingNotificationSender(emailSender, config),
    },
    {
      provide: PublicBookingUseCases,
      inject: [PUBLIC_BOOKING_REPOSITORY, BOOKING_NOTIFICATION_SENDER],
      useFactory: (repository: DrizzlePublicBookingRepository, sender: BookingNotificationSender) =>
        new PublicBookingUseCases(repository, sender),
    },
    {
      provide: AdminCalendarUseCases,
      inject: [ADMIN_CALENDAR_REPOSITORY, BOOKING_NOTIFICATION_SENDER],
      useFactory: (repository: DrizzleAdminCalendarRepository, sender: BookingNotificationSender) =>
        new AdminCalendarUseCases(repository, sender),
    },
  ],
  exports: [BOOKING_NOTIFICATION_SENDER],
})
export class BookingModule {}
