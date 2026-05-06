import { and, eq } from "drizzle-orm";
import type { Database } from "../../infrastructure/database/database.module.js";
import {
  adminTenantMemberships,
  tenantOnboardingInvites,
  tenants,
} from "../../infrastructure/database/schema.js";
import type {
  CreateTenantInviteRecordInput,
  TenantOnboardingRepository,
} from "../application/tenant-onboarding.repository.js";

export class DrizzleTenantOnboardingRepository implements TenantOnboardingRepository {
  constructor(private readonly database: Database) {}

  async createInvite(input: CreateTenantInviteRecordInput) {
    return this.database.transaction(async (transaction) => {
      const [tenant] = await transaction
        .insert(tenants)
        .values({
          slug: input.slug,
          displayName: input.displayName,
          timezone: input.timezone,
          primaryColor: input.primaryColor,
        })
        .returning();

      if (!tenant) {
        throw new TenantOnboardingPersistenceError("Tenant was not created");
      }

      const [invite] = await transaction
        .insert(tenantOnboardingInvites)
        .values({
          tenantId: tenant.id,
          adminEmail: input.adminEmail,
          tokenHash: input.tokenHash,
          expiresAt: input.expiresAt,
        })
        .returning({
          id: tenantOnboardingInvites.id,
          tenantId: tenantOnboardingInvites.tenantId,
          adminEmail: tenantOnboardingInvites.adminEmail,
          expiresAt: tenantOnboardingInvites.expiresAt,
          usedAt: tenantOnboardingInvites.usedAt,
        });

      if (!invite) {
        throw new TenantOnboardingPersistenceError("Invite was not created");
      }

      return {
        ...invite,
        tenantSlug: tenant.slug,
        tenantDisplayName: tenant.displayName,
      };
    });
  }

  async findInviteByTokenHash(tokenHash: string) {
    const [invite] = await this.database
      .select({
        id: tenantOnboardingInvites.id,
        tenantId: tenantOnboardingInvites.tenantId,
        tenantSlug: tenants.slug,
        tenantDisplayName: tenants.displayName,
        adminEmail: tenantOnboardingInvites.adminEmail,
        expiresAt: tenantOnboardingInvites.expiresAt,
        usedAt: tenantOnboardingInvites.usedAt,
      })
      .from(tenantOnboardingInvites)
      .innerJoin(tenants, eq(tenantOnboardingInvites.tenantId, tenants.id))
      .where(eq(tenantOnboardingInvites.tokenHash, tokenHash))
      .limit(1);

    return invite;
  }

  async markInviteUsed(inviteId: string): Promise<void> {
    await this.database
      .update(tenantOnboardingInvites)
      .set({ usedAt: new Date() })
      .where(eq(tenantOnboardingInvites.id, inviteId));
  }

  async createAdminMembership(input: { tenantId: string; userId: string }): Promise<void> {
    await this.database
      .insert(adminTenantMemberships)
      .values(input)
      .onConflictDoNothing({
        target: [adminTenantMemberships.tenantId, adminTenantMemberships.userId],
      });
  }

  async hasAdminMembership(input: { tenantId: string; userId: string }): Promise<boolean> {
    const [membership] = await this.database
      .select({ tenantId: adminTenantMemberships.tenantId })
      .from(adminTenantMemberships)
      .where(
        and(
          eq(adminTenantMemberships.tenantId, input.tenantId),
          eq(adminTenantMemberships.userId, input.userId),
        ),
      )
      .limit(1);

    return Boolean(membership);
  }
}

export class TenantOnboardingPersistenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TenantOnboardingPersistenceError";
  }
}
