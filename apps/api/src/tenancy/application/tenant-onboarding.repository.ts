import type { CreateTenantInviteInput, TenantInviteLookup } from "@agendarhorario/shared";

export const TENANT_ONBOARDING_REPOSITORY = Symbol("TENANT_ONBOARDING_REPOSITORY");

export type CreateTenantInviteRecordInput = CreateTenantInviteInput & {
  tokenHash: string;
  expiresAt: Date;
};

export type TenantOnboardingRepository = {
  createInvite(input: CreateTenantInviteRecordInput): Promise<TenantInviteLookup>;
  findInviteByTokenHash(tokenHash: string): Promise<TenantInviteLookup | undefined>;
  markInviteUsed(inviteId: string): Promise<void>;
  createAdminMembership(input: { tenantId: string; userId: string }): Promise<void>;
  hasAdminMembership(input: { tenantId: string; userId: string }): Promise<boolean>;
};
