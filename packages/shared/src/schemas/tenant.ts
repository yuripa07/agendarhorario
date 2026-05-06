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

export const createTenantInviteSchema = z.object({
  slug: tenantSlugSchema,
  displayName: z.string().trim().min(1).max(120),
  adminEmail: z.string().trim().email().max(254),
  timezone: z.string().trim().min(1).max(64).default("America/Sao_Paulo"),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .default("#2563eb"),
});

export const lookupTenantInviteSchema = z.object({
  token: z.string().trim().min(16),
});

export const acceptTenantInviteSchema = z.object({
  token: z.string().trim().min(16),
  name: z.string().trim().min(1).max(120),
  password: z.string().min(8).max(128),
});

export const tenantInviteLookupSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  tenantSlug: tenantSlugSchema,
  tenantDisplayName: z.string().min(1).max(120),
  adminEmail: z.string().email(),
  expiresAt: z.coerce.date(),
  usedAt: z.coerce.date().nullable(),
});

export const acceptedTenantInviteSchema = z.object({
  tenantId: z.string().uuid(),
  tenantSlug: tenantSlugSchema,
  adminEmail: z.string().email(),
  userId: z.string().min(1),
});

export type Tenant = z.infer<typeof tenantSchema>;
export type TenantBranding = z.infer<typeof tenantBrandingSchema>;
export type UpdateTenantBrandingInput = z.infer<typeof updateTenantBrandingSchema>;
export type CreateTenantInviteInput = z.input<typeof createTenantInviteSchema>;
export type LookupTenantInviteInput = z.input<typeof lookupTenantInviteSchema>;
export type AcceptTenantInviteInput = z.input<typeof acceptTenantInviteSchema>;
export type TenantInviteLookup = z.infer<typeof tenantInviteLookupSchema>;
export type AcceptedTenantInvite = z.infer<typeof acceptedTenantInviteSchema>;
