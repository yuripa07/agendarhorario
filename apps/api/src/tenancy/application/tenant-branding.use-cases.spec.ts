import type { TenantBranding, UpdateTenantBrandingInput } from "@agendarhorario/shared";
import { describe, expect, it } from "vitest";
import type { TenantBrandingRepository } from "./tenant-branding.repository.js";
import {
  TenantBrandingNotFoundError,
  TenantBrandingUseCases,
} from "./tenant-branding.use-cases.js";

describe("TenantBrandingUseCases", () => {
  it("gets tenant branding", async () => {
    const repository = new FakeTenantBrandingRepository();

    await expect(createUseCases(repository).get("tenant-1")).resolves.toEqual({
      displayName: "Barbearia Braga",
      primaryColor: "#2563eb",
    });
  });

  it("updates tenant branding", async () => {
    const repository = new FakeTenantBrandingRepository();
    const input = {
      displayName: "Studio Azul",
      primaryColor: "#0f172a",
    };

    await expect(createUseCases(repository).update("tenant-1", input)).resolves.toEqual(input);
    expect(repository.updated).toEqual(input);
  });

  it("rejects missing tenant branding", async () => {
    const repository = new FakeTenantBrandingRepository();
    repository.branding = undefined;

    await expect(createUseCases(repository).get("missing-tenant")).rejects.toBeInstanceOf(
      TenantBrandingNotFoundError,
    );

    await expect(
      createUseCases(repository).update("missing-tenant", {
        displayName: "Studio Azul",
        primaryColor: "#0f172a",
      }),
    ).rejects.toBeInstanceOf(TenantBrandingNotFoundError);
  });
});

function createUseCases(repository: TenantBrandingRepository): TenantBrandingUseCases {
  return new TenantBrandingUseCases(repository);
}

class FakeTenantBrandingRepository implements TenantBrandingRepository {
  branding: TenantBranding | undefined = {
    displayName: "Barbearia Braga",
    primaryColor: "#2563eb",
  };
  updated: UpdateTenantBrandingInput | undefined;

  findBrandingByTenantId() {
    return Promise.resolve(this.branding);
  }

  updateBrandingByTenantId(_tenantId: string, input: UpdateTenantBrandingInput) {
    if (!this.branding) {
      return Promise.resolve(undefined);
    }

    this.updated = input;
    this.branding = input;

    return Promise.resolve(this.branding);
  }
}
