import { expect, test } from "@playwright/test";

const apiUrl = process.env.VITE_API_URL ?? "http://localhost:3000";

test("first admin accepts a tenant onboarding invite", async ({ page }) => {
  await page.route(`${apiUrl}/admin/onboarding/lookup`, async (route) => {
    await route.fulfill({
      json: {
        tenantSlug: "studio-bela",
        tenantDisplayName: "Studio Bela",
        adminEmail: "admin@studio.test",
        expiresAt: "2026-06-01T00:00:00.000Z",
      },
    });
  });

  await page.route(`${apiUrl}/admin/onboarding/accept`, async (route) => {
    await route.fulfill({
      json: {
        tenantSlug: "studio-bela",
        adminEmail: "admin@studio.test",
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
