import { describe, expect, it } from "vitest";
import { normalizeHost, resolveTenantSlugFromHost } from "./tenant-host.js";

const config = {
  rootDomain: "agendarhorario.com.br",
  reservedSubdomains: ["app", "www"],
};

describe("normalizeHost", () => {
  it("normalizes casing and strips ports", () => {
    expect(normalizeHost("Cliente.AgendarHorario.Com.Br:3000")).toBe(
      "cliente.agendarhorario.com.br",
    );
  });

  it("uses the first forwarded host", () => {
    expect(normalizeHost("cliente.agendarhorario.com.br, proxy.local")).toBe(
      "cliente.agendarhorario.com.br",
    );
  });
});

describe("resolveTenantSlugFromHost", () => {
  it("resolves a tenant slug from a production subdomain", () => {
    expect(resolveTenantSlugFromHost("cliente.agendarhorario.com.br", config)).toBe("cliente");
  });

  it("resolves a tenant slug from localhost-style domains", () => {
    expect(resolveTenantSlugFromHost("cliente.localhost:3000", config)).toBe("cliente");
    expect(resolveTenantSlugFromHost("cliente.localtest.me", config)).toBe("cliente");
  });

  it("does not resolve root or reserved hosts", () => {
    expect(resolveTenantSlugFromHost("agendarhorario.com.br", config)).toBeUndefined();
    expect(resolveTenantSlugFromHost("app.agendarhorario.com.br", config)).toBeUndefined();
    expect(resolveTenantSlugFromHost("www.agendarhorario.com.br", config)).toBeUndefined();
  });

  it("does not resolve nested or unrelated hosts", () => {
    expect(resolveTenantSlugFromHost("a.b.agendarhorario.com.br", config)).toBeUndefined();
    expect(resolveTenantSlugFromHost("example.com", config)).toBeUndefined();
  });
});
