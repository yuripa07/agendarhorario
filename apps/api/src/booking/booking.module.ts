import { Module } from "@nestjs/common";
import {
  DATABASE,
  type Database,
  DatabaseModule,
} from "../infrastructure/database/database.module.js";
import { TenancyModule } from "../tenancy/tenancy.module.js";
import {
  BOOKING_MANAGEMENT_LINK_SENDER,
  type BookingManagementLinkSender,
} from "./application/booking-management-link.sender.js";
import { PUBLIC_BOOKING_REPOSITORY } from "./application/public-booking.repository.js";
import { PublicBookingUseCases } from "./application/public-booking.use-cases.js";
import { DrizzlePublicBookingRepository } from "./infrastructure/drizzle-public-booking.repository.js";
import { NoopBookingManagementLinkSender } from "./infrastructure/noop-booking-management-link.sender.js";
import { PublicBookingController } from "./presentation/public-booking.controller.js";

@Module({
  imports: [DatabaseModule, TenancyModule],
  controllers: [PublicBookingController],
  providers: [
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
  ],
  exports: [BOOKING_MANAGEMENT_LINK_SENDER],
})
export class BookingModule {}
