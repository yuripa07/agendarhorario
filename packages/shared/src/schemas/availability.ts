import { z } from "zod";

export const availabilityBlockIdSchema = z.string().uuid();
export const workingHourIdSchema = z.string().uuid();

export const weekdaySchema = z.number().int().min(0).max(6);
export const dayMinuteSchema = z
  .number()
  .int()
  .min(0)
  .max(24 * 60);

export const workingHourIntervalSchema = z
  .object({
    weekday: weekdaySchema,
    startMinutes: dayMinuteSchema,
    endMinutes: dayMinuteSchema,
    isActive: z.boolean().default(true),
  })
  .refine((value) => value.startMinutes < value.endMinutes, {
    message: "Working hour start must be before end",
    path: ["endMinutes"],
  });

export const workingHourSchema = workingHourIntervalSchema.extend({
  id: workingHourIdSchema,
  tenantId: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const replaceWorkingHoursSchema = z.object({
  workingHours: z.array(workingHourIntervalSchema),
});

export const availabilityBlockSchema = z
  .object({
    id: availabilityBlockIdSchema,
    tenantId: z.string().uuid(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    reason: z.string().trim().max(240).nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
  })
  .refine((value) => value.startsAt < value.endsAt, {
    message: "Availability block start must be before end",
    path: ["endsAt"],
  });

export const createAvailabilityBlockSchema = z
  .object({
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    reason: z.string().trim().min(1).max(240).optional(),
  })
  .refine((value) => value.startsAt < value.endsAt, {
    message: "Availability block start must be before end",
    path: ["endsAt"],
  });

export type WorkingHour = z.infer<typeof workingHourSchema>;
export type WorkingHourInterval = z.infer<typeof workingHourIntervalSchema>;
export type ReplaceWorkingHoursInput = z.infer<typeof replaceWorkingHoursSchema>;
export type AvailabilityBlock = z.infer<typeof availabilityBlockSchema>;
export type CreateAvailabilityBlockInput = z.infer<typeof createAvailabilityBlockSchema>;
