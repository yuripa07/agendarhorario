import { Module } from "@nestjs/common";
import {
  DATABASE,
  type Database,
  DatabaseModule,
} from "../infrastructure/database/database.module.js";
import { TenancyModule } from "../tenancy/tenancy.module.js";
import { ADMIN_CALENDAR_REPOSITORY } from "./application/admin-calendar.repository.js";
import { AdminCalendarUseCases } from "./application/admin-calendar.use-cases.js";
import {
  BOOKING_MANAGEMENT_LINK_SENDER,
  type BookingManagementLinkSender,
} from "./application/booking-management-link.sender.js";
import { PUBLIC_BOOKING_REPOSITORY } from "./application/public-booking.repository.js";
import { PublicBookingUseCases } from "./application/public-booking.use-cases.js";
import { DrizzleAdminCalendarRepository } from "./infrastructure/drizzle-admin-calendar.repository.js";
import { DrizzlePublicBookingRepository } from "./infrastructure/drizzle-public-booking.repository.js";
import { NoopBookingManagementLinkSender } from "./infrastructure/noop-booking-management-link.sender.js";
import { AdminCalendarController } from "./presentation/admin-calendar.controller.js";
import { PublicBookingController } from "./presentation/public-booking.controller.js";

@Module({
  imports: [DatabaseModule, TenancyModule],
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
      provide: BOOKING_MANAGEMENT_LINK_SENDER,
      useClass: NoopBookingManagementLinkSender,
    },
    {
      provide: PublicBookingUseCases,
      inject: [PUBLIC_BOOKING_REPOSITORY, BOOKING_MANAGEMENT_LINK_SENDER],
      useFactory: (
        repository: DrizzlePublicBookingRepository,
        sender: BookingManagementLinkSender,
      ) => new PublicBookingUseCases(repository, sender),
    },
    {
      provide: AdminCalendarUseCases,
      inject: [ADMIN_CALENDAR_REPOSITORY],
      useFactory: (repository: DrizzleAdminCalendarRepository) =>
        new AdminCalendarUseCases(repository),
    },
  ],
  exports: [BOOKING_MANAGEMENT_LINK_SENDER],
})
export class BookingModule {}
