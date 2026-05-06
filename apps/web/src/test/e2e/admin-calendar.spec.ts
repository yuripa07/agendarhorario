import { expect, test } from "@playwright/test";

const apiUrl = "http://localhost:3000";

test("admin signs in and sees the weekly calendar", async ({ page }) => {
  await page.route(`${apiUrl}/auth/sign-in/email`, async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      email: "admin@example.com",
      password: "password123",
    });

    await route.fulfill({
      json: { user: { email: "admin@example.com", name: "Admin" } },
    });
  });

  await page.route(`${apiUrl}/admin/session`, async (route) => {
    await route.fulfill({
      json: { user: { email: "admin@example.com", name: "Admin" } },
    });
  });

  await page.route(`${apiUrl}/admin/calendar/appointments**`, async (route) => {
    await route.fulfill({
      json: [
        {
          id: "22222222-2222-4222-8222-222222222222",
          tenantId: "33333333-3333-4333-8333-333333333333",
          serviceId: "11111111-1111-4111-8111-111111111111",
          serviceName: "Consulta",
          serviceDurationMinutes: 60,
          customerName: "Maria Silva",
          customerEmail: "maria@example.com",
          customerPhone: "+5511999999999",
          startsAt: "2026-05-05T12:00:00.000Z",
          endsAt: "2026-05-05T13:00:00.000Z",
          status: "confirmed",
          canceledAt: null,
        },
      ],
    });
  });

  await page.goto("/admin/login");
  await page.getByLabel("E-mail").fill("admin@example.com");
  await page.getByLabel("Senha").fill("password123");
  await page.getByRole("button", { name: "Entrar" }).click();

  await expect(page).toHaveURL(/\/admin\/calendar/);
  await page.getByRole("button", { name: "Semana" }).click();

  await expect(page.getByRole("heading", { name: "Agenda" })).toBeVisible();
  await expect(page.getByText("Maria Silva")).toBeVisible();
  await expect(page.getByText("Consulta")).toBeVisible();
});

test("anonymous admin calendar access returns to login", async ({ page }) => {
  await page.route(`${apiUrl}/admin/session`, async (route) => {
    await route.fulfill({
      status: 401,
      json: { message: "Unauthorized" },
    });
  });

  await page.goto("/admin/calendar");

  await expect(page).toHaveURL(/\/admin\/login/);
});
