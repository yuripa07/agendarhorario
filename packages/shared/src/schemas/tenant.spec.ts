import { describe, expect, it } from "vitest";
import { tenantBrandingSchema, updateTenantBrandingSchema } from "./tenant.js";

describe("tenant schemas", () => {
  it("accepts tenant branding with display name and primary color", () => {
    expect(
      tenantBrandingSchema.parse({
        displayName: "Barbearia Braga",
        primaryColor: "#2563eb",
      }),
    ).toEqual({
      displayName: "Barbearia Braga",
      primaryColor: "#2563eb",
    });
  });

  it("validates tenant branding updates", () => {
    expect(
      updateTenantBrandingSchema.parse({
        displayName: "  Barbearia Braga  ",
        primaryColor: "#AABBCC",
      }),
    ).toEqual({
      displayName: "Barbearia Braga",
      primaryColor: "#AABBCC",
    });

    expect(() =>
      updateTenantBrandingSchema.parse({
        displayName: "",
        primaryColor: "#2563eb",
      }),
    ).toThrow();

    expect(() =>
      updateTenantBrandingSchema.parse({
        displayName: "Barbearia Braga",
        primaryColor: "2563eb",
      }),
    ).toThrow();
  });
});
