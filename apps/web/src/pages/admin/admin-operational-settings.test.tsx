import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminAvailabilityPage } from "./admin-availability-page.js";
import { AdminBrandingPage } from "./admin-branding-page.js";
import { AdminServicesPage } from "./admin-services-page.js";

const apiUrl = "http://api.test";
const tenantId = "33333333-3333-4333-8333-333333333333";
const serviceId = "11111111-1111-4111-8111-111111111111";
const inactiveServiceId = "22222222-2222-4222-8222-222222222222";
const workingHourId = "44444444-4444-4444-8444-444444444444";
const blockId = "55555555-5555-4555-8555-555555555555";

describe("Admin operational settings", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_URL", apiUrl);
    setLocation("/admin/services");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    setLocation("/");
  });

  it("lists, creates, edits and deactivates services", async () => {
    const fetchMock = vi.fn(createFetchHandler());
    vi.stubGlobal("fetch", fetchMock);
    renderAdminPage(<AdminServicesPage />);

    expect(await screen.findByRole("heading", { name: "Corte" })).toBeInTheDocument();
    expect(screen.getByText("Inativo")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Barba" } });
    fireEvent.change(screen.getByLabelText("Duracao em minutos"), { target: { value: "30" } });
    fireEvent.change(screen.getByLabelText("Preco"), { target: { value: "50,00" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `${apiUrl}/admin/services`,
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          body: JSON.stringify({ name: "Barba", durationMinutes: 30, priceCents: 5000 }),
        }),
      ),
    );

    const editButtons = screen.getAllByRole("button", { name: "Editar" });
    expect(editButtons[0]).toBeDefined();
    fireEvent.click(editButtons[0] as HTMLElement);
    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Corte premium" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `${apiUrl}/admin/services/${serviceId}`,
        expect.objectContaining({
          method: "PATCH",
          credentials: "include",
          body: JSON.stringify({
            name: "Corte premium",
            durationMinutes: 45,
            priceCents: 8000,
          }),
        }),
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "Desativar" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `${apiUrl}/admin/services/${serviceId}`,
        expect.objectContaining({
          method: "DELETE",
          credentials: "include",
        }),
      ),
    );
  });

  it("edits weekly availability and creates/removes blocks", async () => {
    const fetchMock = vi.fn(createFetchHandler());
    vi.stubGlobal("fetch", fetchMock);
    setLocation("/admin/availability");
    renderAdminPage(<AdminAvailabilityPage />);

    expect(await screen.findByLabelText("Segunda-feira inicio 1")).toHaveValue("09:00");
    expect(screen.getByLabelText("Segunda-feira fim 2")).toHaveValue("18:00");

    fireEvent.change(screen.getByLabelText("Segunda-feira inicio 1"), {
      target: { value: "08:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar grade" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `${apiUrl}/admin/availability/working-hours`,
        expect.objectContaining({
          method: "PUT",
          credentials: "include",
          body: JSON.stringify({
            workingHours: [
              { weekday: 1, startMinutes: 480, endMinutes: 720, isActive: true },
              { weekday: 1, startMinutes: 780, endMinutes: 1080, isActive: true },
            ],
          }),
        }),
      ),
    );

    fireEvent.change(screen.getByLabelText("Motivo"), { target: { value: "Feriado" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar bloqueio" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `${apiUrl}/admin/availability/blocks`,
        expect.objectContaining({
          method: "POST",
          credentials: "include",
          body: expect.stringContaining("Feriado"),
        }),
      ),
    );

    fireEvent.click(await screen.findByRole("button", { name: "Remover" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `${apiUrl}/admin/availability/blocks/${blockId}`,
        expect.objectContaining({
          method: "DELETE",
          credentials: "include",
        }),
      ),
    );
  });

  it("loads, validates and saves branding with preview", async () => {
    const fetchMock = vi.fn(createFetchHandler());
    vi.stubGlobal("fetch", fetchMock);
    setLocation("/admin/branding");
    renderAdminPage(<AdminBrandingPage />);

    expect(await screen.findByDisplayValue("Studio Centro")).toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Preview" })).getByText("Studio Centro"),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Cor primaria hex"), { target: { value: "azul" } });
    expect(screen.getByText("Use uma cor no formato #RRGGBB.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Salvar" })).toBeDisabled();

    fireEvent.change(screen.getByDisplayValue("Studio Centro"), {
      target: { value: "Studio Norte" },
    });
    fireEvent.change(screen.getByLabelText("Cor primaria hex"), { target: { value: "#16a34a" } });
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        `${apiUrl}/admin/tenant/branding`,
        expect.objectContaining({
          method: "PATCH",
          credentials: "include",
          body: JSON.stringify({ displayName: "Studio Norte", primaryColor: "#16a34a" }),
        }),
      ),
    );
  });

  it("redirects unauthorized admin pages to login", async () => {
    vi.stubGlobal("fetch", vi.fn(createFetchHandler({ sessionStatus: 401 })));
    renderAdminPage(<AdminServicesPage />);

    await waitFor(() => expect(window.location.pathname).toBe("/admin/login"));
  });
});

function renderAdminPage(children: React.ReactNode): void {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>);
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

    if (url === `${apiUrl}/admin/services` && !init?.method) {
      return json([
        service({ id: serviceId, name: "Corte", isActive: true }),
        service({ id: inactiveServiceId, name: "Coloracao", isActive: false }),
      ]);
    }

    if (url === `${apiUrl}/admin/services` && init?.method === "POST") {
      return json(service({ id: "66666666-6666-4666-8666-666666666666", name: "Barba" }));
    }

    if (url === `${apiUrl}/admin/services/${serviceId}` && init?.method === "PATCH") {
      return json(service({ id: serviceId, name: "Corte premium" }));
    }

    if (url === `${apiUrl}/admin/services/${serviceId}` && init?.method === "DELETE") {
      return json(service({ id: serviceId, name: "Corte", isActive: false }));
    }

    if (url === `${apiUrl}/admin/availability/working-hours` && !init?.method) {
      return json([
        workingHour({ startMinutes: 540, endMinutes: 720 }),
        workingHour({
          id: "77777777-7777-4777-8777-777777777777",
          startMinutes: 780,
          endMinutes: 1080,
        }),
      ]);
    }

    if (url === `${apiUrl}/admin/availability/working-hours` && init?.method === "PUT") {
      return json([]);
    }

    if (url === `${apiUrl}/admin/availability/blocks` && !init?.method) {
      return json([
        {
          id: blockId,
          tenantId,
          startsAt: "2026-05-05T12:00:00.000Z",
          endsAt: "2026-05-05T13:00:00.000Z",
          reason: "Reuniao",
          createdAt: "2026-05-01T12:00:00.000Z",
          updatedAt: "2026-05-01T12:00:00.000Z",
        },
      ]);
    }

    if (url === `${apiUrl}/admin/availability/blocks` && init?.method === "POST") {
      return json({
        id: "88888888-8888-4888-8888-888888888888",
        tenantId,
        startsAt: "2026-05-05T12:00:00.000Z",
        endsAt: "2026-05-05T13:00:00.000Z",
        reason: "Feriado",
        createdAt: "2026-05-01T12:00:00.000Z",
        updatedAt: "2026-05-01T12:00:00.000Z",
      });
    }

    if (url === `${apiUrl}/admin/availability/blocks/${blockId}` && init?.method === "DELETE") {
      return json({
        id: blockId,
        tenantId,
        startsAt: "2026-05-05T12:00:00.000Z",
        endsAt: "2026-05-05T13:00:00.000Z",
        reason: "Reuniao",
        createdAt: "2026-05-01T12:00:00.000Z",
        updatedAt: "2026-05-01T12:00:00.000Z",
      });
    }

    if (url === `${apiUrl}/admin/tenant/branding` && !init?.method) {
      return json({ displayName: "Studio Centro", primaryColor: "#2563eb" });
    }

    if (url === `${apiUrl}/admin/tenant/branding` && init?.method === "PATCH") {
      return json({ displayName: "Studio Norte", primaryColor: "#16a34a" });
    }

    return json({ message: `Unhandled request ${url}` }, { status: 500 });
  };
}

function service(input: { id: string; name: string; isActive?: boolean }): Record<string, unknown> {
  return {
    id: input.id,
    tenantId,
    name: input.name,
    durationMinutes: 45,
    priceCents: 8000,
    isActive: input.isActive ?? true,
    createdAt: "2026-05-01T12:00:00.000Z",
    updatedAt: "2026-05-01T12:00:00.000Z",
  };
}

function workingHour(input: {
  id?: string;
  startMinutes: number;
  endMinutes: number;
}): Record<string, unknown> {
  return {
    id: input.id ?? workingHourId,
    tenantId,
    weekday: 1,
    startMinutes: input.startMinutes,
    endMinutes: input.endMinutes,
    isActive: true,
    createdAt: "2026-05-01T12:00:00.000Z",
    updatedAt: "2026-05-01T12:00:00.000Z",
  };
}

function json(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}
