import {
  type AdminCalendarAppointment,
  type AdminCalendarQuery,
  type AdminCalendarSlot,
  type AvailabilityBlock,
  adminCalendarAppointmentSchema,
  availabilityBlockSchema,
  type CreateAdminAppointmentInput,
  type CreateAvailabilityBlockInput,
  type CreateServiceInput,
  createServiceSchema,
  publicSlotSchema,
  type ReplaceWorkingHoursInput,
  type RescheduleAdminAppointmentInput,
  type Service,
  serviceSchema,
  type TenantBranding,
  tenantBrandingSchema,
  type UpdateServiceInput,
  type UpdateTenantBrandingInput,
  type WorkingHour,
  workingHourSchema,
} from "@agendarhorario/shared";
import { z } from "zod";
import { apiBaseUrl } from "../../shared/api/api-base-url.js";

const adminSessionSchema = z.object({
  user: z
    .object({
      email: z.string().email(),
      name: z.string().nullable().optional(),
    })
    .passthrough(),
});

export type AdminSession = z.infer<typeof adminSessionSchema>;

export class AdminHttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AdminHttpError";
  }
}

export function isUnauthorized(error: unknown): boolean {
  return error instanceof AdminHttpError && error.status === 401;
}

export async function signInAdmin(input: {
  email: string;
  password: string;
}): Promise<AdminSession> {
  return adminSessionSchema.parse(
    await request("/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    }),
  );
}

export async function signOutAdmin(): Promise<void> {
  await request("/auth/sign-out", {
    method: "POST",
    credentials: "include",
  });
}

export async function getAdminSession(): Promise<AdminSession> {
  return adminSessionSchema.parse(
    await request("/admin/session", {
      credentials: "include",
    }),
  );
}

export async function listAdminCalendarAppointments(
  query: AdminCalendarQuery,
): Promise<readonly AdminCalendarAppointment[]> {
  const params = new URLSearchParams({
    startsAt: query.startsAt.toISOString(),
    endsAt: query.endsAt.toISOString(),
  });

  return z.array(adminCalendarAppointmentSchema).parse(
    await request(`/admin/calendar/appointments?${params.toString()}`, {
      credentials: "include",
    }),
  );
}

export async function listAdminCalendarSlots(input: {
  serviceId: string;
  query: AdminCalendarQuery;
}): Promise<readonly AdminCalendarSlot[]> {
  const params = new URLSearchParams({
    startsAt: input.query.startsAt.toISOString(),
    endsAt: input.query.endsAt.toISOString(),
  });

  return z.array(publicSlotSchema).parse(
    await request(`/admin/calendar/services/${input.serviceId}/slots?${params.toString()}`, {
      credentials: "include",
    }),
  );
}

export async function createAdminAppointment(
  input: CreateAdminAppointmentInput,
): Promise<AdminCalendarAppointment> {
  return adminCalendarAppointmentSchema.parse(
    await request("/admin/calendar/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        ...input,
        startsAt: input.startsAt.toISOString(),
      }),
    }),
  );
}

export async function rescheduleAdminAppointment(input: {
  id: string;
  data: RescheduleAdminAppointmentInput;
}): Promise<AdminCalendarAppointment> {
  return adminCalendarAppointmentSchema.parse(
    await request(`/admin/calendar/appointments/${input.id}/reschedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        startsAt: input.data.startsAt.toISOString(),
      }),
    }),
  );
}

export async function cancelAdminAppointment(id: string): Promise<AdminCalendarAppointment> {
  return adminCalendarAppointmentSchema.parse(
    await request(`/admin/calendar/appointments/${id}/cancel`, {
      method: "POST",
      credentials: "include",
    }),
  );
}

export async function listAdminServices(): Promise<readonly Service[]> {
  return z.array(serviceSchema).parse(
    await request("/admin/services", {
      credentials: "include",
    }),
  );
}

export async function createAdminService(input: CreateServiceInput): Promise<Service> {
  return serviceSchema.parse(
    await request("/admin/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(createServiceSchema.parse(input)),
    }),
  );
}

export async function updateAdminService(input: {
  id: string;
  data: UpdateServiceInput;
}): Promise<Service> {
  return serviceSchema.parse(
    await request(`/admin/services/${input.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input.data),
    }),
  );
}

export async function deactivateAdminService(id: string): Promise<Service> {
  return serviceSchema.parse(
    await request(`/admin/services/${id}`, {
      method: "DELETE",
      credentials: "include",
    }),
  );
}

export async function listAdminWorkingHours(): Promise<readonly WorkingHour[]> {
  return z.array(workingHourSchema).parse(
    await request("/admin/availability/working-hours", {
      credentials: "include",
    }),
  );
}

export async function replaceAdminWorkingHours(
  input: ReplaceWorkingHoursInput,
): Promise<readonly WorkingHour[]> {
  return z.array(workingHourSchema).parse(
    await request("/admin/availability/working-hours", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    }),
  );
}

export async function listAdminAvailabilityBlocks(): Promise<readonly AvailabilityBlock[]> {
  return z.array(availabilityBlockSchema).parse(
    await request("/admin/availability/blocks", {
      credentials: "include",
    }),
  );
}

export async function createAdminAvailabilityBlock(
  input: CreateAvailabilityBlockInput,
): Promise<AvailabilityBlock> {
  return availabilityBlockSchema.parse(
    await request("/admin/availability/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    }),
  );
}

export async function deleteAdminAvailabilityBlock(id: string): Promise<AvailabilityBlock> {
  return availabilityBlockSchema.parse(
    await request(`/admin/availability/blocks/${id}`, {
      method: "DELETE",
      credentials: "include",
    }),
  );
}

export async function getAdminTenantBranding(): Promise<TenantBranding> {
  return tenantBrandingSchema.parse(
    await request("/admin/tenant/branding", {
      credentials: "include",
    }),
  );
}

export async function updateAdminTenantBranding(
  input: UpdateTenantBrandingInput,
): Promise<TenantBranding> {
  return tenantBrandingSchema.parse(
    await request("/admin/tenant/branding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    }),
  );
}

async function request(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(`${apiBaseUrl()}${path}`, init);
  const body = await readJson(response);

  if (!response.ok) {
    const message =
      typeof body === "object" &&
      body !== null &&
      "message" in body &&
      typeof body.message === "string"
        ? body.message
        : "Admin request failed";
    throw new AdminHttpError(response.status, message);
  }

  return body;
}

async function readJson(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  return response.json();
}
