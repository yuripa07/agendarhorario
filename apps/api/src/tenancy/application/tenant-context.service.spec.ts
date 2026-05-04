import { describe, expect, it } from "vitest";
import { TenantContextService } from "./tenant-context.service.js";

describe("TenantContextService", () => {
  it("keeps tenant context scoped to the async callback", async () => {
    const service = new TenantContextService();

    await service.run(
      {
        tenantId: "00000000-0000-4000-8000-000000000001",
        tenantSlug: "cliente",
        timezone: "America/Sao_Paulo",
        host: "cliente.agendarhorario.com.br",
      },
      async () => {
        await Promise.resolve();

        expect(service.requireContext().tenantSlug).toBe("cliente");
      },
    );

    expect(service.getContext()).toBeUndefined();
  });
});
