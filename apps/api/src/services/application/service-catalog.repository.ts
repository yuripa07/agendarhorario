import type { CreateServiceInput, Service, UpdateServiceInput } from "@agendarhorario/shared";

export type ServiceCatalogRepository = {
  create(tenantId: string, input: CreateServiceInput): Promise<Service>;
  list(tenantId: string): Promise<readonly Service[]>;
  findById(tenantId: string, serviceId: string): Promise<Service | undefined>;
  update(
    tenantId: string,
    serviceId: string,
    input: UpdateServiceInput,
  ): Promise<Service | undefined>;
  deactivate(tenantId: string, serviceId: string): Promise<Service | undefined>;
};

export const SERVICE_CATALOG_REPOSITORY = Symbol("SERVICE_CATALOG_REPOSITORY");
