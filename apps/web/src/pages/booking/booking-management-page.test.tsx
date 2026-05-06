import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookingManagementPage } from "./booking-management-page.js";

const serviceId = "11111111-1111-4111-8111-111111111111";
const appointmentId = "22222222-2222-4222-8222-222222222222";
const tenantId = "33333333-3333-4333-8333-333333333333";
const apiUrl = "http://api.test";
const token = "booking-token";

describe("BookingManagementPage", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_URL", apiUrl);
    setLocation(`/booking/manage?token=${token}`);
    vi.stubGlobal("fetch", vi.fn(createFetchHandler()));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    setLocation("/booking/manage");
  });

  it("looks up an appointment from the token query string", async () => {
    const fetchMock = vi.mocked(fetch);
    renderBookingManagementPage();

    expect(await screen.findByRole("heading", { name: "Seu agendamento" })).toBeInTheDocument();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.queryByText(token)).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `${apiUrl}/public/bookings/management/lookup`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token }),
      }),
    );
  });

  it("shows an unavailable link state without a token", async () => {
    setLocation("/booking/manage");
    renderBookingManagementPage();

    expect(await screen.findByRole("heading", { name: "Link indisponivel" })).toBeInTheDocument();
  });

  it("shows an unavailable link state for an expired or invalid token", async () => {
    vi.stubGlobal("fetch", vi.fn(createFetchHandler({ lookupStatus: 404 })));
    renderBookingManagementPage();

    expect(await screen.findByRole("heading", { name: "Link indisponivel" })).toBeInTheDocument();
  });

  it("cancels a confirmed appointment", async () => {
    const fetchMock = vi.mocked(fetch);
    renderBookingManagementPage();

    fireEvent.click(await screen.findByRole("button", { name: "Cancelar agendamento" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar cancelamento" }));

    expect(await screen.findByText("Agendamento cancelado.")).toBeInTheDocument();
    expect(screen.getByText("Cancelado")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `${apiUrl}/public/bookings/management/cancel`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ token }),
      }),
    );
  });

  it("reschedules a confirmed appointment", async () => {
    const fetchMock = vi.mocked(fetch);
    renderBookingManagementPage();

    fireEvent.click(await screen.findByRole("button", { name: /10:00/ }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar remarcacao" }));

    expect(await screen.findByText("Agendamento remarcado.")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `${apiUrl}/public/bookings/management/reschedule`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          token,
          startsAt: "2026-05-04T13:00:00.000Z",
        }),
      }),
    );
  });

  it("recovers from a reschedule conflict", async () => {
    vi.stubGlobal("fetch", vi.fn(createFetchHandler({ rescheduleConflictOnce: true })));
    renderBookingManagementPage();

    fireEvent.click(await screen.findByRole("button", { name: /10:00/ }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar remarcacao" }));

    expect(await screen.findByText("Esse horario acabou de ser reservado.")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: "Escolha um horario" })).toBeInTheDocument(),
    );
  });
});

function renderBookingManagementPage(): void {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <BookingManagementPage />
    </QueryClientProvider>,
  );
}

function setLocation(path: string): void {
  window.history.pushState({}, "", path);
}

function createFetchHandler(
  options: { lookupStatus?: number; rescheduleConflictOnce?: boolean } = {},
) {
  let conflictPending = options.rescheduleConflictOnce ?? false;

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = String(input);

    if (url === `${apiUrl}/public/tenant/branding`) {
      return json({ displayName: "Studio Azul", primaryColor: "#0f172a" });
    }

    if (url === `${apiUrl}/public/bookings/management/lookup` && init?.method === "POST") {
      if (options.lookupStatus) {
        return json({ message: "Management token not found" }, { status: options.lookupStatus });
      }

      return json(appointment());
    }

    if (url === `${apiUrl}/public/bookings/management/cancel` && init?.method === "POST") {
      return json({
        ...appointment(),
        status: "canceled",
        canceledAt: "2026-05-04T11:00:00.000Z",
      });
    }

    if (url === `${apiUrl}/public/bookings/management/reschedule` && init?.method === "POST") {
      if (conflictPending) {
        conflictPending = false;
        return json({ message: "Appointment slot is no longer available" }, { status: 409 });
      }

      return json({
        ...appointment(),
        startsAt: "2026-05-04T13:00:00.000Z",
        endsAt: "2026-05-04T14:00:00.000Z",
      });
    }

    if (url.startsWith(`${apiUrl}/public/services/${serviceId}/slots`)) {
      return json([
        {
          startsAt: "2026-05-04T13:00:00.000Z",
          endsAt: "2026-05-04T14:00:00.000Z",
          score: 100,
          isAdjacent: false,
        },
      ]);
    }

    return json({ message: `Unhandled request ${url}` }, { status: 500 });
  };
}

function appointment(): Record<string, unknown> {
  return {
    id: appointmentId,
    tenantId,
    serviceId,
    customerName: "Maria Silva",
    customerEmail: "maria@example.com",
    customerPhone: "+5511999999999",
    startsAt: "2026-05-04T12:00:00.000Z",
    endsAt: "2026-05-04T13:00:00.000Z",
    status: "confirmed",
    managementTokenExpiresAt: "2026-05-05T12:00:00.000Z",
    canceledAt: null,
  };
}

function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}
