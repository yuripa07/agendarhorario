import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminOnboardingPage } from "./admin-onboarding-page.js";

const apiUrl = "http://api.test";

describe("AdminOnboardingPage", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_URL", apiUrl);
    setLocation("/admin/onboarding?token=valid-token");
    vi.stubGlobal("fetch", vi.fn(createFetchHandler()));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    setLocation("/");
  });

  it("accepts an invite and signs in the first admin", async () => {
    const fetchMock = vi.mocked(fetch);
    renderAdminOnboardingPage();

    expect(await screen.findByText("Studio Bela")).toBeInTheDocument();
    expect(screen.getByDisplayValue("admin@studio.test")).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Nome"), { target: { value: "Admin Bela" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Criar conta" }));

    await screen.findByRole("button", { name: "Criar conta" });

    expect(fetchMock).toHaveBeenCalledWith(
      `${apiUrl}/admin/onboarding/accept`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          token: "valid-token",
          name: "Admin Bela",
          password: "password123",
        }),
      }),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      `${apiUrl}/auth/sign-in/email`,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          email: "admin@studio.test",
          password: "password123",
        }),
      }),
    );
    expect(window.location.pathname).toBe("/admin/calendar");
  });

  it("shows a recoverable error for an invalid invite", async () => {
    vi.stubGlobal("fetch", vi.fn(createFetchHandler({ lookupStatus: 404 })));
    renderAdminOnboardingPage();

    expect(await screen.findByText("Convite invalido ou expirado.")).toBeInTheDocument();
  });
});

function renderAdminOnboardingPage(): void {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <AdminOnboardingPage />
    </QueryClientProvider>,
  );
}

function setLocation(path: string): void {
  window.history.pushState({}, "", path);
}

function createFetchHandler(options: { lookupStatus?: number } = {}) {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = String(input);

    if (url === `${apiUrl}/admin/onboarding/lookup` && init?.method === "POST") {
      if (options.lookupStatus) {
        return json({ message: "Invalid invite" }, { status: options.lookupStatus });
      }

      return json({
        id: "11111111-1111-4111-8111-111111111111",
        tenantId: "22222222-2222-4222-8222-222222222222",
        tenantSlug: "studio-bela",
        tenantDisplayName: "Studio Bela",
        adminEmail: "admin@studio.test",
        expiresAt: "2026-06-01T00:00:00.000Z",
        usedAt: null,
      });
    }

    if (url === `${apiUrl}/admin/onboarding/accept` && init?.method === "POST") {
      return json({
        tenantId: "22222222-2222-4222-8222-222222222222",
        tenantSlug: "studio-bela",
        adminEmail: "admin@studio.test",
        userId: "user-1",
      });
    }

    if (url === `${apiUrl}/auth/sign-in/email` && init?.method === "POST") {
      return json({ user: { email: "admin@studio.test", name: "Admin Bela" } });
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
