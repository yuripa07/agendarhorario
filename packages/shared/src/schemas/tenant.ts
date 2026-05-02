import { z } from "zod";

export const tenantSlugSchema = z
  .string()
  .min(2)
  .max(63)
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/);

export const tenantSchema = z.object({
  id: z.string().uuid(),
  slug: tenantSlugSchema,
  displayName: z.string().min(1).max(120),
  timezone: z.string().default("America/Sao_Paulo"),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Tenant = z.infer<typeof tenantSchema>;
