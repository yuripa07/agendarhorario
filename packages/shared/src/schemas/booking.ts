import { z } from "zod";
import { serviceIdSchema, serviceSchema } from "./service.js";

export const appointmentIdSchema = z.string().uuid();

export const appointmentStatusSchema = z.enum(["confirmed", "canceled"]);

export const utcInstantSchema = z
  .string()
  .datetime({ offset: false })
  .regex(/Z$/, "Expected a UTC instant ending in Z")
  .transform((value) => new Date(value));

export const publicSlotsQuerySchema = z
  .object({
    startsAt: utcInstantSchema,
    endsAt: utcInstantSchema,
  })
  .refine((value) => value.startsAt < value.endsAt, {
    message: "startsAt must be before endsAt",
    path: ["endsAt"],
  });

export const publicSlotSchema = z.object({
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  score: z.number().int(),
  isAdjacent: z.boolean(),
});

export const createPublicBookingSchema = z.object({
  serviceId: serviceIdSchema,
  startsAt: utcInstantSchema,
  customerName: z.string().trim().min(1).max(120),
  customerEmail: z.string().trim().email().max(254),
  customerPhone: z.string().trim().min(8).max(32),
  privacyAccepted: z.literal(true),
});

export const managementTokenSchema = z.object({
  token: z.string().trim().min(1),
});

export const reschedulePublicBookingSchema = z.object({
  token: z.string().trim().min(1),
  startsAt: utcInstantSchema,
});

export const publicServiceSchema = serviceSchema;

export const publicAppointmentSchema = z.object({
  id: appointmentIdSchema,
  tenantId: z.string().uuid(),
  serviceId: serviceIdSchema,
  customerName: z.string(),
  customerEmail: z.string().email(),
  customerPhone: z.string(),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  status: appointmentStatusSchema,
  managementTokenExpiresAt: z.coerce.date(),
  canceledAt: z.coerce.date().nullable(),
});

export type PublicSlotsQuery = z.infer<typeof publicSlotsQuerySchema>;
export type PublicSlot = z.infer<typeof publicSlotSchema>;
export type CreatePublicBookingInput = z.infer<typeof createPublicBookingSchema>;
export type ManagementTokenInput = z.infer<typeof managementTokenSchema>;
export type ReschedulePublicBookingInput = z.infer<typeof reschedulePublicBookingSchema>;
export type PublicService = z.infer<typeof publicServiceSchema>;
export type PublicAppointment = z.infer<typeof publicAppointmentSchema>;
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
