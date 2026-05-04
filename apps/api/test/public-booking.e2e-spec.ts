import { Test, type TestingModule } from "@nestjs/testing";
import { eq } from "drizzle-orm";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  BOOKING_NOTIFICATION_SENDER,
  type BookingNotificationSender,
} from "../src/booking/application/booking-notification.sender.js";
import { DATABASE, type Database } from "../src/infrastructure/database/database.module.js";
import { services, tenants, workingHours } from "../src/infrastructure/database/schema.js";
import { AppModule } from "../src/presentation/app.module.js";

describe("Public booking API", () => {
  const tenantSlug = `public-booking-${Date.now()}`;
  const tenantHost = `${tenantSlug}.agendarhorario.com.br`;
  const otherTenantSlug = `public-booking-other-${Date.now()}`;
  const otherTenantHost = `${otherTenantSlug}.agendarhorario.com.br`;

  let moduleRef: TestingModule;
  let database: Database;
  let server: Parameters<typeof request>[0];
  let sender: CapturingBookingNotificationSender;
  let serviceId: string;

  beforeAll(async () => {
    sender = new CapturingBookingNotificationSender();
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(BOOKING_NOTIFICATION_SENDER)
      .useValue(sender)
      .compile();

    const app = moduleRef.createNestApplication();
    await app.init();

    database = moduleRef.get<Database>(DATABASE);
    server = app.getHttpServer();

    const [tenant, otherTenant] = await database
      .insert(tenants)
      .values([
        { slug: tenantSlug, displayName: "Public Booking Tenant" },
        { slug: otherTenantSlug, displayName: "Other Public Booking Tenant" },
      ])
      .returning();

    const [activeService] = await database
      .insert(services)
      .values([
        {
          tenantId: requireRecord(tenant).id,
          name: "Corte masculino",
          durationMinutes: 60,
          priceCents: 5000,
          isActive: true,
        },
        {
          tenantId: requireRecord(tenant).id,
          name: "Servico inativo",
          durationMinutes: 30,
          priceCents: 3000,
          isActive: false,
        },
        {
          tenantId: requireRecord(otherTenant).id,
          name: "Outro tenant",
          durationMinutes: 60,
          priceCents: 5000,
          isActive: true,
        },
      ])
      .returning();

    serviceId = requireRecord(activeService).id;

    await database.insert(workingHours).values({
      tenantId: requireRecord(tenant).id,
      weekday: 1,
      startMinutes: 9 * 60,
      endMinutes: 12 * 60,
    });
  });

  afterAll(async () => {
    await database?.delete(tenants).where(eq(tenants.slug, tenantSlug));
    await database?.delete(tenants).where(eq(tenants.slug, otherTenantSlug));
    await moduleRef?.close();
  });

  it("lists active services and slots without an admin cookie", async () => {
    const listed = await request(server)
      .get("/public/services")
      .set("Host", tenantHost)
      .expect(200);

    expect(listed.body).toHaveLength(1);
    expect(listed.body[0]).toMatchObject({
      id: serviceId,
      name: "Corte masculino",
      isActive: true,
    });

    const otherTenantListed = await request(server)
      .get("/public/services")
      .set("Host", otherTenantHost)
      .expect(200);

    expect(otherTenantListed.body).toHaveLength(1);
    expect(otherTenantListed.body[0].id).not.toBe(serviceId);

    const slots = await request(server)
      .get(`/public/services/${serviceId}/slots`)
      .query({
        startsAt: "2026-05-04T12:00:00.000Z",
        endsAt: "2026-05-04T16:00:00.000Z",
      })
      .set("Host", tenantHost)
      .expect(200);

    expect(slots.body[0]).toMatchObject({
      startsAt: "2026-05-04T12:00:00.000Z",
      endsAt: "2026-05-04T13:00:00.000Z",
    });
  });

  it("creates a booking, blocks duplicates and cancels by management token", async () => {
    const created = await request(server)
      .post("/public/bookings")
      .set("Host", tenantHost)
      .send({
        serviceId,
        startsAt: "2026-05-04T12:00:00.000Z",
        customerName: "Maria Silva",
        customerEmail: "maria@example.com",
        customerPhone: "+5511999999999",
        privacyAccepted: true,
      })
      .expect(201);

    expect(created.body).toMatchObject({
      serviceId,
      status: "confirmed",
      customerEmail: "maria@example.com",
    });
    expect(created.body.managementToken).toBeUndefined();

    const token = sender.created[0]?.token;
    expect(token).toBeTruthy();
    expect(sender.created[0]).toMatchObject({
      customerEmail: "maria@example.com",
      serviceName: "Corte masculino",
      startsAt: new Date("2026-05-04T12:00:00.000Z"),
      timezone: "America/Sao_Paulo",
    });

    await request(server)
      .post("/public/bookings")
      .set("Host", tenantHost)
      .send({
        serviceId,
        startsAt: "2026-05-04T12:00:00.000Z",
        customerName: "Ana Souza",
        customerEmail: "ana@example.com",
        customerPhone: "+5511888888888",
        privacyAccepted: true,
      })
      .expect(409);

    const lookup = await request(server)
      .post("/public/bookings/management/lookup")
      .send({ token })
      .expect(200);

    expect(lookup.body).toMatchObject({
      id: created.body.id,
      status: "confirmed",
    });

    await request(server).post("/public/bookings/management/cancel").send({ token }).expect(200);
    expect(sender.canceled.at(-1)).toMatchObject({
      customerEmail: "maria@example.com",
      serviceName: "Corte masculino",
      startsAt: new Date("2026-05-04T12:00:00.000Z"),
    });

    await request(server)
      .post("/public/bookings")
      .set("Host", tenantHost)
      .send({
        serviceId,
        startsAt: "2026-05-04T12:00:00.000Z",
        customerName: "Ana Souza",
        customerEmail: "ana@example.com",
        customerPhone: "+5511888888888",
        privacyAccepted: true,
      })
      .expect(201);
  });

  it("reschedules a booking by management token and releases the old slot", async () => {
    const first = await request(server)
      .post("/public/bookings")
      .set("Host", tenantHost)
      .send({
        serviceId,
        startsAt: "2026-05-04T13:00:00.000Z",
        customerName: "Joao Lima",
        customerEmail: "joao@example.com",
        customerPhone: "+5511777777777",
        privacyAccepted: true,
      })
      .expect(201);

    const token = sender.created.at(-1)?.token;
    expect(token).toBeTruthy();

    const rescheduled = await request(server)
      .post("/public/bookings/management/reschedule")
      .send({ token, startsAt: "2026-05-04T14:00:00.000Z" })
      .expect(200);

    expect(rescheduled.body).toMatchObject({
      id: first.body.id,
      status: "confirmed",
      startsAt: "2026-05-04T14:00:00.000Z",
      endsAt: "2026-05-04T15:00:00.000Z",
    });
    expect(sender.rescheduled.at(-1)).toMatchObject({
      customerEmail: "joao@example.com",
      serviceName: "Corte masculino",
      startsAt: new Date("2026-05-04T14:00:00.000Z"),
    });

    await request(server)
      .post("/public/bookings")
      .set("Host", tenantHost)
      .send({
        serviceId,
        startsAt: "2026-05-04T13:00:00.000Z",
        customerName: "Carla Rocha",
        customerEmail: "carla@example.com",
        customerPhone: "+5511666666666",
        privacyAccepted: true,
      })
      .expect(201);

    await request(server)
      .post("/public/bookings")
      .set("Host", tenantHost)
      .send({
        serviceId,
        startsAt: "2026-05-04T14:00:00.000Z",
        customerName: "Paula Dias",
        customerEmail: "paula@example.com",
        customerPhone: "+5511555555555",
        privacyAccepted: true,
      })
      .expect(409);

    await request(server)
      .post("/public/bookings/management/lookup")
      .send({ token })
      .expect(200)
      .expect(({ body }) => {
        expect(body.startsAt).toBe("2026-05-04T14:00:00.000Z");
      });
  });
});

function requireRecord<T>(record: T | undefined): T {
  if (!record) {
    throw new Error("Expected database record");
  }

  return record;
}

class CapturingBookingNotificationSender implements BookingNotificationSender {
  readonly created: Parameters<BookingNotificationSender["bookingCreated"]>[0][] = [];
  readonly canceled: Parameters<BookingNotificationSender["bookingCanceled"]>[0][] = [];
  readonly rescheduled: Parameters<BookingNotificationSender["bookingRescheduled"]>[0][] = [];

  bookingCreated(input: Parameters<BookingNotificationSender["bookingCreated"]>[0]): Promise<void> {
    this.created.push(input);

    return Promise.resolve();
  }

  bookingCanceled(
    input: Parameters<BookingNotificationSender["bookingCanceled"]>[0],
  ): Promise<void> {
    this.canceled.push(input);

    return Promise.resolve();
  }

  bookingRescheduled(
    input: Parameters<BookingNotificationSender["bookingRescheduled"]>[0],
  ): Promise<void> {
    this.rescheduled.push(input);

    return Promise.resolve();
  }
}
