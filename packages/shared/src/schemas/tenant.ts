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

export const tenantBrandingSchema = tenantSchema.pick({
  displayName: true,
  primaryColor: true,
});

export const updateTenantBrandingSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
});

export type Tenant = z.infer<typeof tenantSchema>;
export type TenantBranding = z.infer<typeof tenantBrandingSchema>;
export type UpdateTenantBrandingInput = z.infer<typeof updateTenantBrandingSchema>;
