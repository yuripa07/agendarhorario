import {
  type CreatePublicBookingInput,
  type ManagementTokenInput,
  type PublicAppointment,
  type PublicService,
  type PublicSlot,
  type PublicSlotsQuery,
  publicAppointmentSchema,
  publicServiceSchema,
  publicSlotSchema,
  type ReschedulePublicBookingInput,
  type TenantBranding,
  tenantBrandingSchema,
} from "@agendarhorario/shared";
import { z } from "zod";

const defaultApiUrl = "http://localhost:3000";

export class PublicBookingHttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "PublicBookingHttpError";
  }
}

export function isBookingConflict(error: unknown): boolean {
  return error instanceof PublicBookingHttpError && error.status === 409;
}

export function isPublicBookingNotFound(error: unknown): boolean {
  return error instanceof PublicBookingHttpError && error.status === 404;
}

export function isPublicBookingInvalidRequest(error: unknown): boolean {
  return error instanceof PublicBookingHttpError && error.status === 400;
}

export async function getTenantBranding(): Promise<TenantBranding> {
  return tenantBrandingSchema.parse(await request("/public/tenant/branding"));
}

export async function listPublicServices(): Promise<readonly PublicService[]> {
  return z.array(publicServiceSchema).parse(await request("/public/services"));
}

export async function listPublicSlots(
  serviceId: string,
  query: PublicSlotsQuery,
): Promise<readonly PublicSlot[]> {
  const params = new URLSearchParams({
    startsAt: query.startsAt.toISOString(),
    endsAt: query.endsAt.toISOString(),
  });

  return z
    .array(publicSlotSchema)
    .parse(await request(`/public/services/${serviceId}/slots?${params.toString()}`));
}

export async function createPublicBooking(
  input: CreatePublicBookingInput,
): Promise<PublicAppointment> {
  return publicAppointmentSchema.parse(
    await request("/public/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function lookupPublicBooking(input: ManagementTokenInput): Promise<PublicAppointment> {
  return publicAppointmentSchema.parse(
    await request("/public/bookings/management/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function cancelPublicBooking(input: ManagementTokenInput): Promise<PublicAppointment> {
  return publicAppointmentSchema.parse(
    await request("/public/bookings/management/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

export async function reschedulePublicBooking(
  input: ReschedulePublicBookingInput,
): Promise<PublicAppointment> {
  return publicAppointmentSchema.parse(
    await request("/public/bookings/management/reschedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}

function apiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || defaultApiUrl;
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
        : "Public booking request failed";
    throw new PublicBookingHttpError(response.status, message);
  }

  return body;
}

async function readJson(response: Response): Promise<unknown> {
  if (response.status === 204) {
    return null;
  }

  return response.json();
}
