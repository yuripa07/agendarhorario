import { randomUUID } from "node:crypto";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import type { Database } from "../../infrastructure/database/database.module.js";
import { account, user } from "../../infrastructure/database/schema.js";
import {
  type TenantOnboardingAuth,
  TenantOnboardingInvalidCredentialsError,
} from "../application/tenant-onboarding.use-cases.js";

export class DrizzleTenantOnboardingAuth implements TenantOnboardingAuth {
  constructor(private readonly database: Database) {}

  async createOrVerifyUser(input: { email: string; name: string; password: string }) {
    const existingUser = await this.findExistingCredentialUser(input.email);

    if (existingUser) {
      const validPassword = await verifyPassword({
        hash: existingUser.password,
        password: input.password,
      });

      if (!validPassword) {
        throw new TenantOnboardingInvalidCredentialsError();
      }

      return {
        id: existingUser.id,
        email: existingUser.email,
      };
    }

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

  private async findExistingCredentialUser(email: string): Promise<
    | {
        id: string;
        email: string;
        password: string;
      }
    | undefined
  > {
    const [existingUser] = await this.database
      .select({
        id: user.id,
        email: user.email,
        password: account.password,
      })
      .from(user)
      .innerJoin(account, eq(account.userId, user.id))
      .where(eq(user.email, email))
      .limit(1);

    if (!existingUser?.password) {
      return undefined;
    }

    return {
      id: existingUser.id,
      email: existingUser.email,
      password: existingUser.password,
    };
  }
}
