import type { CreateServiceInput, Service, UpdateServiceInput } from "@agendarhorario/shared";
import { and, asc, eq, type SQL, sql } from "drizzle-orm";
import type { Database } from "../../infrastructure/database/database.module.js";
import { type ServiceRecord, services } from "../../infrastructure/database/schema.js";
import type { ServiceCatalogRepository } from "../application/service-catalog.repository.js";

export class DrizzleServiceCatalogRepository implements ServiceCatalogRepository {
  constructor(private readonly database: Database) {}

  async create(tenantId: string, input: CreateServiceInput): Promise<Service> {
    const [service] = await this.database
      .insert(services)
      .values({
        tenantId,
        name: input.name,
        durationMinutes: input.durationMinutes,
        priceCents: input.priceCents,
      })
      .returning();

    return mapServiceRecord(requireServiceRecord(service));
  }

  async list(tenantId: string): Promise<readonly Service[]> {
    const records = await this.database.query.services.findMany({
      where: eq(services.tenantId, tenantId),
      orderBy: [asc(services.name)],
    });

    return records.map(mapServiceRecord);
  }

  async findById(tenantId: string, serviceId: string): Promise<Service | undefined> {
    const service = await this.database.query.services.findFirst({
      where: and(eq(services.tenantId, tenantId), eq(services.id, serviceId)),
    });

    return service ? mapServiceRecord(service) : undefined;
  }

  async update(
    tenantId: string,
    serviceId: string,
    input: UpdateServiceInput,
  ): Promise<Service | undefined> {
    const updateValues: Partial<Pick<ServiceRecord, "durationMinutes" | "name" | "priceCents">> & {
      updatedAt: SQL;
    } = {
      updatedAt: sql`now()`,
    };

    if (input.name !== undefined) {
      updateValues.name = input.name;
    }

    if (input.durationMinutes !== undefined) {
      updateValues.durationMinutes = input.durationMinutes;
    }

    if (input.priceCents !== undefined) {
      updateValues.priceCents = input.priceCents;
    }

    const [service] = await this.database
      .update(services)
      .set(updateValues)
      .where(and(eq(services.tenantId, tenantId), eq(services.id, serviceId)))
      .returning();

    return service ? mapServiceRecord(service) : undefined;
  }

  async deactivate(tenantId: string, serviceId: string): Promise<Service | undefined> {
    const [service] = await this.database
      .update(services)
      .set({
        isActive: false,
        updatedAt: sql`now()`,
      })
      .where(and(eq(services.tenantId, tenantId), eq(services.id, serviceId)))
      .returning();

    return service ? mapServiceRecord(service) : undefined;
  }
}

function mapServiceRecord(record: ServiceRecord): Service {
  return {
    id: record.id,
    tenantId: record.tenantId,
    name: record.name,
    durationMinutes: record.durationMinutes,
    priceCents: record.priceCents,
    isActive: record.isActive,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function requireServiceRecord(record: ServiceRecord | undefined): ServiceRecord {
  if (!record) {
    throw new ServicePersistenceError();
  }

  return record;
}

class ServicePersistenceError extends Error {
  constructor() {
    super("Service persistence failed");
    this.name = "ServicePersistenceError";
  }
}
