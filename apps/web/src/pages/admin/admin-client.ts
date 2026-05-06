import {
  type AdminCalendarAppointment,
  type AdminCalendarQuery,
  adminCalendarAppointmentSchema,
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
