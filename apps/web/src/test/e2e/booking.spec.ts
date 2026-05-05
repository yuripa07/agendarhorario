import { expect, test } from "@playwright/test";

const apiUrl = "http://localhost:3000";
const serviceId = "11111111-1111-4111-8111-111111111111";
const tenantId = "33333333-3333-4333-8333-333333333333";

test("creates a booking from the public flow", async ({ page }) => {
  await page.route(`${apiUrl}/public/tenant/branding`, async (route) => {
    await route.fulfill({
      json: { displayName: "Studio Azul", primaryColor: "#0f172a" },
    });
  });

  await page.route(`${apiUrl}/public/services`, async (route) => {
    await route.fulfill({
      json: [
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
      ],
    });
  });

  await page.route(`${apiUrl}/public/services/${serviceId}/slots**`, async (route) => {
    await route.fulfill({
      json: [
        {
          startsAt: "2026-05-04T12:00:00.000Z",
          endsAt: "2026-05-04T13:00:00.000Z",
          score: 100,
          isAdjacent: false,
        },
      ],
    });
  });

  await page.route(`${apiUrl}/public/bookings`, async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      serviceId,
      startsAt: "2026-05-04T12:00:00.000Z",
      customerName: "Maria Silva",
      customerEmail: "maria@example.com",
      customerPhone: "+5511999999999",
      privacyAccepted: true,
    });

    await route.fulfill({
      status: 201,
      json: {
        id: "22222222-2222-4222-8222-222222222222",
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
    });
  });

  await page.goto("/booking");
  await page.getByRole("button", { name: /Corte masculino/ }).click();
  await page.getByRole("button", { name: /09:00/ }).click();
  await page.getByLabel("Nome").fill("Maria Silva");
  await page.getByLabel("E-mail").fill("maria@example.com");
  await page.getByLabel("Telefone").fill("+5511999999999");
  await page.getByLabel("Aceito a politica de privacidade").check();
  await page.getByRole("button", { name: "Confirmar agendamento" }).click();

  await expect(page.getByRole("heading", { name: "Agendamento confirmado" })).toBeVisible();
  await expect(page.getByText("Maria Silva")).toBeVisible();
  await expect(page.getByText(/token/i)).toHaveCount(0);
});
