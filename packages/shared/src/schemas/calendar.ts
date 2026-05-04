import { z } from "zod";
import { appointmentIdSchema, appointmentStatusSchema, utcInstantSchema } from "./booking.js";
import { serviceIdSchema } from "./service.js";

export const adminCalendarQuerySchema = z
  .object({
    startsAt: utcInstantSchema,
    endsAt: utcInstantSchema,
  })
  .refine((value) => value.startsAt < value.endsAt, {
    message: "startsAt must be before endsAt",
    path: ["endsAt"],
  });

export const adminCalendarAppointmentSchema = z.object({
  id: appointmentIdSchema,
  tenantId: z.string().uuid(),
  serviceId: serviceIdSchema,
  serviceName: z.string().min(1).max(120),
  serviceDurationMinutes: z.number().int().positive(),
  customerName: z.string().min(1).max(120),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(8).max(32),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  status: appointmentStatusSchema,
  canceledAt: z.coerce.date().nullable(),
});

export type AdminCalendarQuery = z.infer<typeof adminCalendarQuerySchema>;
export type AdminCalendarAppointment = z.infer<typeof adminCalendarAppointmentSchema>;
