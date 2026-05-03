import { z } from "zod";

export const serviceIdSchema = z.string().uuid();

export const serviceNameSchema = z.string().trim().min(1).max(120);

export const serviceDurationMinutesSchema = z
  .number()
  .int()
  .min(5)
  .max(24 * 60);

export const servicePriceCentsSchema = z.number().int().min(0);

export const serviceSchema = z.object({
  id: serviceIdSchema,
  tenantId: z.string().uuid(),
  name: serviceNameSchema,
  durationMinutes: serviceDurationMinutesSchema,
  priceCents: servicePriceCentsSchema,
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const createServiceSchema = z.object({
  name: serviceNameSchema,
  durationMinutes: serviceDurationMinutesSchema,
  priceCents: servicePriceCentsSchema,
});

export const updateServiceSchema = createServiceSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, "At least one service field must be provided");

export type Service = z.infer<typeof serviceSchema>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
