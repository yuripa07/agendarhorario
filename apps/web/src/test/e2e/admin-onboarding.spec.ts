import { expect, test } from "@playwright/test";

const apiUrl = "http://127.0.0.1:3000";

test("first admin accepts a tenant onboarding invite", async ({ page }) => {
  await page.route(`${apiUrl}/admin/onboarding/lookup`, async (route) => {
    await route.fulfill({
      json: {
        id: "11111111-1111-4111-8111-111111111111",
        tenantId: "22222222-2222-4222-8222-222222222222",
        tenantSlug: "studio-bela",
        tenantDisplayName: "Studio Bela",
        adminEmail: "admin@studio.test",
        expiresAt: "2026-06-01T00:00:00.000Z",
        usedAt: null,
      },
    });
  });

  await page.route(`${apiUrl}/admin/onboarding/accept`, async (route) => {
    await route.fulfill({
      json: {
        tenantId: "22222222-2222-4222-8222-222222222222",
        tenantSlug: "studio-bela",
        adminEmail: "admin@studio.test",
        userId: "user-1",
      },
    });
  });

  await page.route(`${apiUrl}/auth/sign-in/email`, async (route) => {
    await route.fulfill({
      json: { user: { email: "admin@studio.test", name: "Admin Bela" } },
    });
  });

  await page.route(`${apiUrl}/admin/session`, async (route) => {
    await route.fulfill({
      json: { user: { email: "admin@studio.test", name: "Admin Bela" } },
    });
  });

  await page.route(`${apiUrl}/admin/calendar/appointments**`, async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.route(`${apiUrl}/admin/services`, async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.goto("/admin/onboarding?token=valid-token");
  await expect(page.getByRole("heading", { name: "Ativar tenant" })).toBeVisible();
  await expect(page.getByText("Studio Bela")).toBeVisible();

  await page.getByLabel("Nome").fill("Admin Bela");
  await page.getByLabel("Senha").fill("password123");
  await page.getByRole("button", { name: "Criar conta" }).click();

  await expect(page).toHaveURL(/\/admin\/calendar/);
});
