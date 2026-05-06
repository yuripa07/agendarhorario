import type { CreateTenantInviteInput, TenantInviteLookup } from "@agendarhorario/shared";
import { describe, expect, it } from "vitest";
import {
  hashTenantInviteToken,
  TenantInviteAlreadyUsedError,
  TenantInviteExpiredError,
  TenantInviteInvalidError,
  type TenantOnboardingAuth,
  type TenantOnboardingRepository,
  TenantOnboardingUseCases,
} from "./tenant-onboarding.use-cases.js";

describe("TenantOnboardingUseCases", () => {
  it("creates a one-time invite without exposing the stored token hash", async () => {
    const repository = new FakeTenantOnboardingRepository();
    const useCases = createUseCases(repository);

    const invite = await useCases.createInvite({
      slug: "studio-bela",
      displayName: "Studio Bela",
      adminEmail: "admin@studio.test",
    });

    expect(invite).toMatchObject({
      token: "raw-onboarding-token",
      tenantSlug: "studio-bela",
      adminEmail: "admin@studio.test",
      expiresAt: new Date("2026-05-13T00:00:00.000Z"),
    });
    expect(repository.invites[0]?.tokenHash).toBe(hashTenantInviteToken("raw-onboarding-token"));
    expect(repository.invites[0]?.tokenHash).not.toBe("raw-onboarding-token");
  });

  it("accepts a valid invite once and links the created admin to the tenant", async () => {
    const repository = new FakeTenantOnboardingRepository();
    const auth = new FakeTenantOnboardingAuth();
    const useCases = createUseCases(repository, auth);
    await useCases.createInvite({
      slug: "studio-bela",
      displayName: "Studio Bela",
      adminEmail: "admin@studio.test",
    });

    const accepted = await useCases.acceptInvite({
      token: "raw-onboarding-token",
      name: "Admin Bela",
      password: "password123",
    });

    expect(accepted).toEqual({
      tenantId: "tenant-1",
      tenantSlug: "studio-bela",
      adminEmail: "admin@studio.test",
      userId: "user-1",
    });
    expect(auth.createdUsers[0]).toEqual({
      email: "admin@studio.test",
      name: "Admin Bela",
      password: "password123",
    });
    expect(repository.memberships).toEqual([{ tenantId: "tenant-1", userId: "user-1" }]);

    await expect(
      useCases.acceptInvite({
        token: "raw-onboarding-token",
        name: "Admin Bela",
        password: "password123",
      }),
    ).rejects.toBeInstanceOf(TenantInviteAlreadyUsedError);
  });

  it("rejects missing and expired invites", async () => {
    const repository = new FakeTenantOnboardingRepository();
    const useCases = createUseCases(repository);

    await expect(useCases.lookupInvite({ token: "missing-token" })).rejects.toBeInstanceOf(
      TenantInviteInvalidError,
    );

    await useCases.createInvite({
      slug: "studio-bela",
      displayName: "Studio Bela",
      adminEmail: "admin@studio.test",
    });
    repository.invites[0] = {
      ...requireValue(repository.invites[0]),
      expiresAt: new Date("2026-04-30T00:00:00.000Z"),
    };

    await expect(
      useCases.acceptInvite({
        token: "raw-onboarding-token",
        name: "Admin Bela",
        password: "password123",
      }),
    ).rejects.toBeInstanceOf(TenantInviteExpiredError);
  });
});

function createUseCases(
  repository = new FakeTenantOnboardingRepository(),
  auth: TenantOnboardingAuth = new FakeTenantOnboardingAuth(),
): TenantOnboardingUseCases {
  return new TenantOnboardingUseCases(
    repository,
    auth,
    () => new Date("2026-05-06T00:00:00.000Z"),
    () => "raw-onboarding-token",
  );
}

class FakeTenantOnboardingRepository implements TenantOnboardingRepository {
  invites: Array<
    TenantInviteLookup & {
      tokenHash: string;
    }
  > = [];
  memberships: Array<{ tenantId: string; userId: string }> = [];

  async createInvite(input: CreateTenantInviteInput & { tokenHash: string; expiresAt: Date }) {
    const invite = {
      id: `invite-${this.invites.length + 1}`,
      tenantId: `tenant-${this.invites.length + 1}`,
      tenantSlug: input.slug,
      tenantDisplayName: input.displayName,
      adminEmail: input.adminEmail,
      expiresAt: input.expiresAt,
      usedAt: null,
      tokenHash: input.tokenHash,
    };

    this.invites.push(invite);

    return invite;
  }

  async findInviteByTokenHash(tokenHash: string): Promise<TenantInviteLookup | undefined> {
    return this.invites.find((invite) => invite.tokenHash === tokenHash);
  }

  async markInviteUsed(inviteId: string): Promise<void> {
    const invite = this.invites.find((candidate) => candidate.id === inviteId);

    if (invite) {
      invite.usedAt = new Date("2026-05-06T00:00:00.000Z");
    }
  }

  async createAdminMembership(input: { tenantId: string; userId: string }): Promise<void> {
    this.memberships.push(input);
  }

  async hasAdminMembership(input: { tenantId: string; userId: string }): Promise<boolean> {
    return this.memberships.some(
      (membership) => membership.tenantId === input.tenantId && membership.userId === input.userId,
    );
  }
}

class FakeTenantOnboardingAuth implements TenantOnboardingAuth {
  createdUsers: Array<{ email: string; name: string; password: string }> = [];

  async createOrVerifyUser(input: { email: string; name: string; password: string }) {
    this.createdUsers.push({
      email: input.email,
      name: input.name,
      password: input.password,
    });

    return { id: "user-1", email: input.email };
  }
}

function requireValue<T>(value: T | undefined): T {
  if (!value) {
    throw new Error("Expected value to be defined");
  }

  return value;
}
