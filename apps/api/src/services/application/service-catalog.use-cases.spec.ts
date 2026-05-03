import { randomUUID } from "node:crypto";
import type { CreateServiceInput, Service, UpdateServiceInput } from "@agendarhorario/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { ServiceNotFoundError } from "../domain/service.errors.js";
import type { ServiceCatalogRepository } from "./service-catalog.repository.js";
import { ServiceCatalogUseCases } from "./service-catalog.use-cases.js";

class InMemoryServiceCatalogRepository implements ServiceCatalogRepository {
  private readonly services = new Map<string, Service>();

  async create(tenantId: string, input: CreateServiceInput): Promise<Service> {
    const now = new Date();
    const service = {
      id: randomUUID(),
      tenantId,
      name: input.name,
      durationMinutes: input.durationMinutes,
      priceCents: input.priceCents,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    this.services.set(service.id, service);
    return service;
  }

  async list(tenantId: string): Promise<readonly Service[]> {
    return [...this.services.values()].filter((service) => service.tenantId === tenantId);
  }

  async findById(tenantId: string, serviceId: string): Promise<Service | undefined> {
    const service = this.services.get(serviceId);
    return service?.tenantId === tenantId ? service : undefined;
  }

  async update(
    tenantId: string,
    serviceId: string,
    input: UpdateServiceInput,
  ): Promise<Service | undefined> {
    const service = await this.findById(tenantId, serviceId);

    if (!service) {
      return undefined;
    }

    const updated = {
      ...service,
      name: input.name ?? service.name,
      durationMinutes: input.durationMinutes ?? service.durationMinutes,
      priceCents: input.priceCents ?? service.priceCents,
      updatedAt: new Date(),
    };
    this.services.set(serviceId, updated);
    return updated;
  }

  async deactivate(tenantId: string, serviceId: string): Promise<Service | undefined> {
    const service = await this.findById(tenantId, serviceId);

    if (!service) {
      return undefined;
    }

    const updated = { ...service, isActive: false, updatedAt: new Date() };
    this.services.set(serviceId, updated);
    return updated;
  }
}

describe("ServiceCatalogUseCases", () => {
  let repository: InMemoryServiceCatalogRepository;
  let useCases: ServiceCatalogUseCases;

  beforeEach(() => {
    repository = new InMemoryServiceCatalogRepository();
    useCases = new ServiceCatalogUseCases(repository);
  });

  it("creates active services for the current tenant", async () => {
    const service = await useCases.create("00000000-0000-4000-8000-000000000001", {
      name: "Corte masculino",
      durationMinutes: 45,
      priceCents: 5000,
    });

    expect(service).toMatchObject({
      tenantId: "00000000-0000-4000-8000-000000000001",
      name: "Corte masculino",
      durationMinutes: 45,
      priceCents: 5000,
      isActive: true,
    });
  });

  it("lists only services from the requested tenant", async () => {
    const tenantA = "00000000-0000-4000-8000-000000000001";
    const tenantB = "00000000-0000-4000-8000-000000000002";
    await useCases.create(tenantA, { name: "Corte", durationMinutes: 30, priceCents: 4000 });
    await useCases.create(tenantB, { name: "Barba", durationMinutes: 20, priceCents: 2500 });

    const services = await useCases.list(tenantA);

    expect(services).toHaveLength(1);
    expect(services[0]?.tenantId).toBe(tenantA);
  });

  it("does not return services from another tenant", async () => {
    const service = await useCases.create("00000000-0000-4000-8000-000000000001", {
      name: "Corte",
      durationMinutes: 30,
      priceCents: 4000,
    });

    await expect(
      useCases.get("00000000-0000-4000-8000-000000000002", service.id),
    ).rejects.toBeInstanceOf(ServiceNotFoundError);
  });

  it("deactivates services instead of deleting them", async () => {
    const tenantId = "00000000-0000-4000-8000-000000000001";
    const service = await useCases.create(tenantId, {
      name: "Corte",
      durationMinutes: 30,
      priceCents: 4000,
    });

    const deactivated = await useCases.deactivate(tenantId, service.id);

    expect(deactivated.isActive).toBe(false);
  });
});
