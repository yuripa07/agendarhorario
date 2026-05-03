import type { CreateServiceInput, Service, UpdateServiceInput } from "@agendarhorario/shared";
import { Inject, Injectable } from "@nestjs/common";
import { ServiceNotFoundError } from "../domain/service.errors.js";
import {
  SERVICE_CATALOG_REPOSITORY,
  type ServiceCatalogRepository,
} from "./service-catalog.repository.js";

@Injectable()
export class ServiceCatalogUseCases {
  constructor(
    @Inject(SERVICE_CATALOG_REPOSITORY)
    private readonly repository: ServiceCatalogRepository,
  ) {}

  create(tenantId: string, input: CreateServiceInput): Promise<Service> {
    return this.repository.create(tenantId, input);
  }

  list(tenantId: string): Promise<readonly Service[]> {
    return this.repository.list(tenantId);
  }

  async get(tenantId: string, serviceId: string): Promise<Service> {
    const service = await this.repository.findById(tenantId, serviceId);

    if (!service) {
      throw new ServiceNotFoundError();
    }

    return service;
  }

  async update(tenantId: string, serviceId: string, input: UpdateServiceInput): Promise<Service> {
    const service = await this.repository.update(tenantId, serviceId, input);

    if (!service) {
      throw new ServiceNotFoundError();
    }

    return service;
  }

  async deactivate(tenantId: string, serviceId: string): Promise<Service> {
    const service = await this.repository.deactivate(tenantId, serviceId);

    if (!service) {
      throw new ServiceNotFoundError();
    }

    return service;
  }
}
