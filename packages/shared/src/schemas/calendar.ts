import { z } from "zod";
import {
  appointmentIdSchema,
  appointmentStatusSchema,
  type publicSlotSchema,
  utcInstantSchema,
} from "./booking.js";
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

export const createAdminAppointmentSchema = z.object({
  serviceId: serviceIdSchema,
  startsAt: utcInstantSchema,
  customerName: z.string().trim().min(1).max(120),
  customerEmail: z.string().trim().email().max(254),
  customerPhone: z.string().trim().min(8).max(32),
});

export const rescheduleAdminAppointmentSchema = z.object({
  startsAt: utcInstantSchema,
});

export type AdminCalendarQuery = z.infer<typeof adminCalendarQuerySchema>;
export type AdminCalendarAppointment = z.infer<typeof adminCalendarAppointmentSchema>;
export type AdminCalendarSlot = z.infer<typeof publicSlotSchema>;
export type CreateAdminAppointmentInput = z.infer<typeof createAdminAppointmentSchema>;
export type RescheduleAdminAppointmentInput = z.infer<typeof rescheduleAdminAppointmentSchema>;
