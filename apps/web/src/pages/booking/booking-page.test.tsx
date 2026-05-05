import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookingPage } from "./booking-page.js";

const serviceId = "11111111-1111-4111-8111-111111111111";
const appointmentId = "22222222-2222-4222-8222-222222222222";
const tenantId = "33333333-3333-4333-8333-333333333333";
const apiUrl = "http://api.test";

describe("BookingPage", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_URL", apiUrl);
    vi.stubGlobal("fetch", vi.fn(createFetchHandler()));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("renders tenant branding", async () => {
    renderBookingPage();

    expect(await screen.findByText("Studio Azul")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Agendar horario" })).toBeInTheDocument();
  });

  it("selects a service and loads selectable slots", async () => {
    renderBookingPage();

    fireEvent.click(await screen.findByRole("button", { name: /Corte masculino/ }));

    expect(await screen.findByRole("heading", { name: "Escolha um horario" })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /09:00/ })).toBeInTheDocument();
  });

  it("validates customer details before submitting", async () => {
    renderBookingPage();

    await chooseFirstSlot();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar agendamento" }));

    expect(await screen.findByText("Informe seu nome.")).toBeInTheDocument();
    expect(screen.getByText("Informe um e-mail valido.")).toBeInTheDocument();
    expect(screen.getByText("Informe um telefone valido.")).toBeInTheDocument();
    expect(
      screen.getByText("Aceite a politica de privacidade para continuar."),
    ).toBeInTheDocument();
  });

  it("posts the expected booking payload", async () => {
    const fetchMock = vi.mocked(fetch);
    renderBookingPage();

    await chooseFirstSlot();
    await fillCustomerDetails();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar agendamento" }));

    await screen.findByRole("heading", { name: "Agendamento confirmado" });
    expect(fetchMock).toHaveBeenCalledWith(
      `${apiUrl}/public/bookings`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          serviceId,
          startsAt: "2026-05-04T12:00:00.000Z",
          customerName: "Maria Silva",
          customerEmail: "maria@example.com",
          customerPhone: "+5511999999999",
          privacyAccepted: true,
        }),
      }),
    );
  });

  it("recovers from a booking conflict", async () => {
    vi.stubGlobal("fetch", vi.fn(createFetchHandler({ conflictOnce: true })));
    renderBookingPage();

    await chooseFirstSlot();
    await fillCustomerDetails();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar agendamento" }));

    expect(await screen.findByText("Esse horario acabou de ser reservado.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Escolha um horario" })).toBeInTheDocument();
  });

  it("shows confirmation without exposing a management token", async () => {
    renderBookingPage();

    await chooseFirstSlot();
    await fillCustomerDetails();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar agendamento" }));

    expect(
      await screen.findByRole("heading", { name: "Agendamento confirmado" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Maria Silva")).toBeInTheDocument();
    expect(screen.queryByText(/token/i)).not.toBeInTheDocument();
  });
});

function renderBookingPage(): void {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <BookingPage />
    </QueryClientProvider>,
  );
}

async function chooseFirstSlot(): Promise<void> {
  fireEvent.click(await screen.findByRole("button", { name: /Corte masculino/ }));
  fireEvent.click(await screen.findByRole("button", { name: /09:00/ }));
}

async function fillCustomerDetails(): Promise<void> {
  fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Maria Silva" } });
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "maria@example.com" } });
  fireEvent.change(screen.getByLabelText("Telefone"), { target: { value: "+5511999999999" } });
  fireEvent.click(screen.getByLabelText("Aceito a politica de privacidade"));
  await waitFor(() =>
    expect(
      within(screen.getByRole("form", { name: "Dados do cliente" })).getByDisplayValue(
        "Maria Silva",
      ),
    ).toBeInTheDocument(),
  );
}

function createFetchHandler(options: { conflictOnce?: boolean } = {}) {
  let conflictPending = options.conflictOnce ?? false;

  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = String(input);

    if (url === `${apiUrl}/public/tenant/branding`) {
      return json({ displayName: "Studio Azul", primaryColor: "#0f172a" });
    }

    if (url === `${apiUrl}/public/services`) {
      return json([
        {
          id: serviceId,
          tenantId,
          name: "Corte masculino",
          durationMinutes: 60,
          priceCents: 5000,
          isActive: true,
          createdAt: "2026-05-01T12:00:00.000Z",
          updatedAt: "2026-05-01T12:00:00.000Z",
        },
      ]);
    }

    if (url.startsWith(`${apiUrl}/public/services/${serviceId}/slots`)) {
      return json([
        {
          startsAt: "2026-05-04T12:00:00.000Z",
          endsAt: "2026-05-04T13:00:00.000Z",
          score: 100,
          isAdjacent: false,
        },
      ]);
    }

    if (url === `${apiUrl}/public/bookings` && init?.method === "POST") {
      if (conflictPending) {
        conflictPending = false;
        return json({ message: "Appointment slot is no longer available" }, { status: 409 });
      }

      return json(
        {
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
        },
        { status: 201 },
      );
    }

    return json({ message: `Unhandled request ${url}` }, { status: 500 });
  };
}

function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}
