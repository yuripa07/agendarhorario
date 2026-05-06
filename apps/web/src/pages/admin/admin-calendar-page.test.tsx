import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminCalendarPage } from "./admin-calendar-page.js";

const apiUrl = "http://api.test";
const appointmentId = "22222222-2222-4222-8222-222222222222";
const tenantId = "33333333-3333-4333-8333-333333333333";
const serviceId = "11111111-1111-4111-8111-111111111111";

describe("AdminCalendarPage", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_URL", apiUrl);
    setLocation("/admin/calendar?date=2026-05-05");
    vi.stubGlobal("fetch", vi.fn(createFetchHandler()));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    setLocation("/");
  });

  it("redirects anonymous users to login", async () => {
    vi.stubGlobal("fetch", vi.fn(createFetchHandler({ sessionStatus: 401 })));
    renderAdminCalendarPage();

    await waitFor(() => expect(window.location.pathname).toBe("/admin/login"));
  });

  it("loads the daily calendar window", async () => {
    const fetchMock = vi.mocked(fetch);
    renderAdminCalendarPage();

    expect(await screen.findByRole("heading", { name: "Agenda" })).toBeInTheDocument();
    expect(await screen.findByText("Maria Silva")).toBeInTheDocument();
    expect(screen.getByText("Consulta")).toBeInTheDocument();
    expect(screen.getByText("+5511999999999")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `${apiUrl}/admin/calendar/appointments?startsAt=2026-05-05T00%3A00%3A00.000Z&endsAt=2026-05-06T00%3A00%3A00.000Z`,
      expect.objectContaining({
        credentials: "include",
      }),
    );
  });

  it("loads the weekly calendar grouped by day", async () => {
    const fetchMock = vi.mocked(fetch);
    renderAdminCalendarPage();

    fireEvent.click(await screen.findByRole("button", { name: "Semana" }));

    expect(await screen.findByRole("heading", { name: "Terça-feira" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Quarta-feira" })).toBeInTheDocument();
    expect(screen.getByText("Ana Souza")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `${apiUrl}/admin/calendar/appointments?startsAt=2026-05-04T00%3A00%3A00.000Z&endsAt=2026-05-11T00%3A00%3A00.000Z`,
      expect.objectContaining({
        credentials: "include",
      }),
    );
  });

  it("signs out and returns to login", async () => {
    const fetchMock = vi.mocked(fetch);
    renderAdminCalendarPage();

    fireEvent.click(await screen.findByRole("button", { name: "Sair" }));

    await waitFor(() => expect(window.location.pathname).toBe("/admin/login"));
    expect(fetchMock).toHaveBeenCalledWith(
      `${apiUrl}/auth/sign-out`,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
      }),
    );
  });
});

function renderAdminCalendarPage(): void {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <AdminCalendarPage />
    </QueryClientProvider>,
  );
}

function setLocation(path: string): void {
  window.history.pushState({}, "", path);
}

function createFetchHandler(options: { sessionStatus?: number } = {}) {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = String(input);

    if (url === `${apiUrl}/admin/session`) {
      if (options.sessionStatus) {
        return json({ message: "Unauthorized" }, { status: options.sessionStatus });
      }

      return json({ user: { email: "admin@example.com", name: "Admin" } });
    }

    if (url.startsWith(`${apiUrl}/admin/calendar/appointments`)) {
      const requestedUrl = new URL(url);
      const startsAt = new Date(requestedUrl.searchParams.get("startsAt") ?? "");
      const endsAt = new Date(requestedUrl.searchParams.get("endsAt") ?? "");
      const appointments = [
        appointment({
          id: appointmentId,
          customerName: "Maria Silva",
          startsAt: "2026-05-05T12:00:00.000Z",
          endsAt: "2026-05-05T13:00:00.000Z",
          status: "confirmed",
        }),
        appointment({
          id: "44444444-4444-4444-8444-444444444444",
          customerName: "Ana Souza",
          startsAt: "2026-05-06T14:00:00.000Z",
          endsAt: "2026-05-06T15:00:00.000Z",
          status: "canceled",
          canceledAt: "2026-05-05T18:00:00.000Z",
        }),
      ].filter((calendarAppointment) => {
        const appointmentStartsAt = new Date(String(calendarAppointment.startsAt));
        return appointmentStartsAt >= startsAt && appointmentStartsAt < endsAt;
      });

      return json(appointments);
    }

    if (url === `${apiUrl}/auth/sign-out` && init?.method === "POST") {
      return json({});
    }

    return json({ message: `Unhandled request ${url}` }, { status: 500 });
  };
}

function appointment(input: {
  id: string;
  customerName: string;
  startsAt: string;
  endsAt: string;
  status: "confirmed" | "canceled";
  canceledAt?: string | null;
}): Record<string, unknown> {
  return {
    id: input.id,
    tenantId,
    serviceId,
    serviceName: "Consulta",
    serviceDurationMinutes: 60,
    customerName: input.customerName,
    customerEmail: "cliente@example.com",
    customerPhone: "+5511999999999",
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    status: input.status,
    canceledAt: input.canceledAt ?? null,
  };
}

function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}
