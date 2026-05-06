import { createHash, randomBytes } from "node:crypto";
import type {
  AcceptedTenantInvite,
  AcceptTenantInviteInput,
  CreateTenantInviteInput,
  LookupTenantInviteInput,
  TenantInviteLookup,
} from "@agendarhorario/shared";
import { addDays } from "date-fns";
import type { TenantOnboardingRepository } from "./tenant-onboarding.repository.js";

export type { TenantOnboardingRepository } from "./tenant-onboarding.repository.js";

type Clock = () => Date;
type TokenGenerator = () => string;

export type TenantOnboardingAuth = {
  createUser(input: {
    email: string;
    name: string;
    password: string;
  }): Promise<{ id: string; email: string }>;
};

export class TenantOnboardingUseCases {
  constructor(
    private readonly repository: TenantOnboardingRepository,
    private readonly auth: TenantOnboardingAuth,
    private readonly clock: Clock = () => new Date(),
    private readonly tokenGenerator: TokenGenerator = () => randomBytes(32).toString("base64url"),
  ) {}

  async createInvite(input: CreateTenantInviteInput): Promise<
    TenantInviteLookup & {
      token: string;
    }
  > {
    const token = this.tokenGenerator();
    const invite = await this.repository.createInvite({
      ...input,
      tokenHash: hashTenantInviteToken(token),
      expiresAt: addDays(this.clock(), 7),
    });

    return { ...invite, token };
  }

  async lookupInvite(input: LookupTenantInviteInput): Promise<TenantInviteLookup> {
    return this.requireUsableInvite(input.token);
  }

  async acceptInvite(input: AcceptTenantInviteInput): Promise<AcceptedTenantInvite> {
    const invite = await this.requireUsableInvite(input.token);
    const user = await this.auth.createUser({
      email: invite.adminEmail,
      name: input.name,
      password: input.password,
    });

    await this.repository.createAdminMembership({
      tenantId: invite.tenantId,
      userId: user.id,
    });
    await this.repository.markInviteUsed(invite.id);

    return {
      tenantId: invite.tenantId,
      tenantSlug: invite.tenantSlug,
      adminEmail: invite.adminEmail,
      userId: user.id,
    };
  }

  private async requireUsableInvite(token: string): Promise<TenantInviteLookup> {
    const invite = await this.repository.findInviteByTokenHash(hashTenantInviteToken(token));

    if (!invite) {
      throw new TenantInviteInvalidError();
    }

    if (invite.usedAt) {
      throw new TenantInviteAlreadyUsedError();
    }

    if (invite.expiresAt <= this.clock()) {
      throw new TenantInviteExpiredError();
    }

    return invite;
  }
}

export function hashTenantInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export class TenantInviteInvalidError extends Error {
  constructor() {
    super("Tenant invite is invalid");
    this.name = "TenantInviteInvalidError";
  }
}

export class TenantInviteExpiredError extends Error {
  constructor() {
    super("Tenant invite is expired");
    this.name = "TenantInviteExpiredError";
  }
}

export class TenantInviteAlreadyUsedError extends Error {
  constructor() {
    super("Tenant invite was already used");
    this.name = "TenantInviteAlreadyUsedError";
  }
}
