import { AsyncLocalStorage } from "node:async_hooks";
import { Injectable } from "@nestjs/common";
import type { TenantContext } from "../domain/tenant-context.js";

@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantContext>();

  run<T>(context: TenantContext, callback: () => T): T {
    return this.storage.run(context, callback);
  }

  getContext(): TenantContext | undefined {
    return this.storage.getStore();
  }

  requireContext(): TenantContext {
    const context = this.getContext();

    if (!context) {
      throw new Error("Tenant context is not available");
    }

    return context;
  }
}
