import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminLoginPage } from "./admin-login-page.js";

const apiUrl = "http://api.test";

describe("AdminLoginPage", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_API_URL", apiUrl);
    setLocation("/admin/login");
    vi.stubGlobal("fetch", vi.fn(createFetchHandler()));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    setLocation("/");
  });

  it("signs in with email and password", async () => {
    const fetchMock = vi.mocked(fetch);
    renderAdminLoginPage();

    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "admin@example.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    await screen.findByRole("button", { name: "Entrar" });

    expect(fetchMock).toHaveBeenCalledWith(
      `${apiUrl}/auth/sign-in/email`,
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          email: "admin@example.com",
          password: "password123",
        }),
      }),
    );
    expect(window.location.pathname).toBe("/admin/calendar");
  });

  it("shows a recoverable error for invalid credentials", async () => {
    vi.stubGlobal("fetch", vi.fn(createFetchHandler({ signInStatus: 401 })));
    renderAdminLoginPage();

    fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "admin@example.com" } });
    fireEvent.change(screen.getByLabelText("Senha"), { target: { value: "wrong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText("Nao foi possivel entrar. Confira os dados."),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/admin/login");
  });
});

function renderAdminLoginPage(): void {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <AdminLoginPage />
    </QueryClientProvider>,
  );
}

function setLocation(path: string): void {
  window.history.pushState({}, "", path);
}

function createFetchHandler(options: { signInStatus?: number } = {}) {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = String(input);

    if (url === `${apiUrl}/auth/sign-in/email` && init?.method === "POST") {
      if (options.signInStatus) {
        return json({ message: "Invalid credentials" }, { status: options.signInStatus });
      }

      return json({ user: { email: "admin@example.com", name: "Admin" } });
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
