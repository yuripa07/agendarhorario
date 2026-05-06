import { expect, test } from "@playwright/test";

const apiUrl = "http://127.0.0.1:3000";
const serviceId = "11111111-1111-4111-8111-111111111111";
const tenantId = "33333333-3333-4333-8333-333333333333";
const token = "booking-token";

test("reschedules a booking from the public management flow", async ({ page }) => {
  await page.route(`${apiUrl}/public/tenant/branding`, async (route) => {
    await route.fulfill({
      json: { displayName: "Studio Azul", primaryColor: "#0f172a" },
    });
  });

  await page.route(`${apiUrl}/public/bookings/management/lookup`, async (route) => {
    expect(route.request().postDataJSON()).toEqual({ token });

    await route.fulfill({
      json: appointment(),
    });
  });

  await page.route(`${apiUrl}/public/services/${serviceId}/slots**`, async (route) => {
    await route.fulfill({
      json: [
        {
          startsAt: "2026-05-04T13:00:00.000Z",
          endsAt: "2026-05-04T14:00:00.000Z",
          score: 100,
          isAdjacent: false,
        },
      ],
    });
  });

  await page.route(`${apiUrl}/public/bookings/management/reschedule`, async (route) => {
    expect(route.request().postDataJSON()).toEqual({
      token,
      startsAt: "2026-05-04T13:00:00.000Z",
    });

    await route.fulfill({
      json: {
        ...appointment(),
        startsAt: "2026-05-04T13:00:00.000Z",
        endsAt: "2026-05-04T14:00:00.000Z",
      },
    });
  });

  await page.goto(`/booking/manage?token=${token}`);

  await expect(page.getByRole("heading", { name: "Seu agendamento" })).toBeVisible();
  await expect(page.getByText("Maria Silva")).toBeVisible();
  await expect(page.getByText(token)).toHaveCount(0);

  await page.getByRole("button", { name: /10:00/ }).click();
  await page.getByRole("button", { name: "Confirmar remarcacao" }).click();

  await expect(page.getByText("Agendamento remarcado.")).toBeVisible();
});

function appointment(): Record<string, unknown> {
  return {
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
  };
}
