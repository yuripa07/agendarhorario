import { ConfigService } from "@nestjs/config";
import { describe, expect, it, vi } from "vitest";
import { TenantContextService } from "../application/tenant-context.service.js";
import type { TenantLookup } from "../infrastructure/tenant.repository.js";
import { TenantResolutionMiddleware } from "./tenant-resolution.middleware.js";

const tenant = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "cliente",
  displayName: "Cliente",
  timezone: "America/Sao_Paulo",
  primaryColor: "#2563eb",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("TenantResolutionMiddleware", () => {
  it("loads tenant and exposes context for tenant hosts", async () => {
    const context = new TenantContextService();
    const repository = {
      findBySlug: vi.fn().mockResolvedValue(tenant),
    } satisfies TenantLookup;
    const middleware = new TenantResolutionMiddleware(
      new ConfigService({
        ROOT_DOMAIN: "agendarhorario.com.br",
        RESERVED_SUBDOMAINS: "app,www",
      }),
      context,
      repository,
    );
    const next = vi.fn(() => {
      expect(context.requireContext().tenantSlug).toBe("cliente");
    });

    await middleware.use({ headers: { host: "cliente.agendarhorario.com.br" } }, {}, next);

    expect(repository.findBySlug).toHaveBeenCalledWith("cliente");
    expect(next).toHaveBeenCalledOnce();
  });

  it("skips root hosts", async () => {
    const repository = {
      findBySlug: vi.fn(),
    } satisfies TenantLookup;
    const middleware = new TenantResolutionMiddleware(
      new ConfigService({
        ROOT_DOMAIN: "agendarhorario.com.br",
        RESERVED_SUBDOMAINS: "app,www",
      }),
      new TenantContextService(),
      repository,
    );
    const next = vi.fn();

    await middleware.use({ headers: { host: "agendarhorario.com.br" } }, {}, next);

    expect(repository.findBySlug).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });

  it("returns a not found error when tenant slug does not exist", async () => {
    const repository = {
      findBySlug: vi.fn().mockResolvedValue(undefined),
    } satisfies TenantLookup;
    const middleware = new TenantResolutionMiddleware(
      new ConfigService({
        ROOT_DOMAIN: "agendarhorario.com.br",
        RESERVED_SUBDOMAINS: "app,www",
      }),
      new TenantContextService(),
      repository,
    );
    const next = vi.fn();

    await middleware.use({ headers: { host: "missing.agendarhorario.com.br" } }, {}, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: "Tenant not found" }));
  });
});
