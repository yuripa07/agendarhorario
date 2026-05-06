import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type { Database } from "../../infrastructure/database/database.module.js";
import { account, user } from "../../infrastructure/database/schema.js";
import type { TenantOnboardingAuth } from "../application/tenant-onboarding.use-cases.js";

export class DrizzleTenantOnboardingAuth implements TenantOnboardingAuth {
  constructor(private readonly database: Database) {}

  async createUser(input: { email: string; name: string; password: string }) {
    const now = new Date();
    const userId = randomUUID();
    const passwordHash = await hashPassword(input.password);

    await this.database.transaction(async (transaction) => {
      await transaction.insert(user).values({
        id: userId,
        email: input.email,
        name: input.name,
        emailVerified: false,
        createdAt: now,
        updatedAt: now,
      });

      await transaction.insert(account).values({
        id: randomUUID(),
        userId,
        accountId: userId,
        providerId: "credential",
        password: passwordHash,
        createdAt: now,
        updatedAt: now,
      });
    });

    return {
      id: userId,
      email: input.email,
    };
  }
}
