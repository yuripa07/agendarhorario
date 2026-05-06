import { expect, test } from "@playwright/test";

const apiUrl = "http://127.0.0.1:3000";
const tenantId = "33333333-3333-4333-8333-333333333333";
const serviceId = "11111111-1111-4111-8111-111111111111";
const blockId = "55555555-5555-4555-8555-555555555555";

test.beforeEach(async ({ page }) => {
  await page.route(`${apiUrl}/admin/session`, async (route) => {
    await route.fulfill({
      json: { user: { email: "admin@example.com", name: "Admin" } },
    });
  });

  await page.route(`${apiUrl}/admin/calendar/appointments**`, async (route) => {
    await route.fulfill({ json: [] });
  });
});

test("admin manages services from the admin shell", async ({ page }) => {
  await page.route(`${apiUrl}/admin/services`, async (route) => {
    const request = route.request();
    if (request.method() === "POST") {
      expect(request.postDataJSON()).toEqual({
        name: "Barba",
        durationMinutes: 30,
        priceCents: 5000,
      });
      await route.fulfill({ json: service({ id: "66666666-6666-4666-8666-666666666666" }) });
      return;
    }

    await route.fulfill({ json: [service({ id: serviceId, name: "Corte" })] });
  });

  await page.route(`${apiUrl}/admin/services/${serviceId}`, async (route) => {
    if (route.request().method() === "PATCH") {
      expect(route.request().postDataJSON()).toEqual({
        name: "Corte premium",
        durationMinutes: 45,
        priceCents: 8000,
      });
      await route.fulfill({ json: service({ id: serviceId, name: "Corte premium" }) });
      return;
    }

    await route.fulfill({ json: service({ id: serviceId, name: "Corte", isActive: false }) });
  });

  await page.goto("/admin/calendar");
  await page.getByRole("link", { name: "Servicos" }).click();

  await expect(page).toHaveURL(/\/admin\/services/);
  await expect(page.getByRole("heading", { name: "Corte" })).toBeVisible();

  await page.getByLabel("Nome").fill("Barba");
  await page.getByLabel("Duracao em minutos").fill("30");
  await page.getByLabel("Preco").fill("50,00");
  await page.getByRole("button", { name: "Criar" }).click();

  await page.getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Nome").fill("Corte premium");
  await page.getByRole("button", { name: "Salvar" }).click();
  await page.getByRole("button", { name: "Desativar" }).click();
});

test("admin configures availability and blocks", async ({ page }) => {
  await page.route(`${apiUrl}/admin/availability/working-hours`, async (route) => {
    if (route.request().method() === "PUT") {
      expect(route.request().postDataJSON()).toEqual({
        workingHours: [
          { weekday: 1, startMinutes: 480, endMinutes: 720, isActive: true },
          { weekday: 1, startMinutes: 780, endMinutes: 1080, isActive: true },
        ],
      });
      await route.fulfill({ json: [] });
      return;
    }

    await route.fulfill({
      json: [
        workingHour({
          id: "44444444-4444-4444-8444-444444444444",
          startMinutes: 540,
          endMinutes: 720,
        }),
        workingHour({
          id: "77777777-7777-4777-8777-777777777777",
          startMinutes: 780,
          endMinutes: 1080,
        }),
      ],
    });
  });

  await page.route(`${apiUrl}/admin/availability/blocks`, async (route) => {
    if (route.request().method() === "POST") {
      expect(route.request().postDataJSON().reason).toBe("Feriado");
      await route.fulfill({
        json: block({ id: "88888888-8888-4888-8888-888888888888", reason: "Feriado" }),
      });
      return;
    }

    await route.fulfill({ json: [block({ id: blockId, reason: "Reuniao" })] });
  });

  await page.route(`${apiUrl}/admin/availability/blocks/${blockId}`, async (route) => {
    await route.fulfill({ json: block({ id: blockId, reason: "Reuniao" }) });
  });

  await page.goto("/admin/availability");
  await expect(page.getByRole("heading", { name: "Disponibilidade" })).toBeVisible();
  await page.getByLabel("Segunda-feira inicio 1").fill("08:00");
  await page.getByRole("button", { name: "Salvar grade" }).click();
  await page.getByLabel("Motivo").fill("Feriado");
  await page.getByRole("button", { name: "Criar bloqueio" }).click();
  await page.getByRole("button", { name: "Remover", exact: true }).click();
});

test("admin updates branding and sees the preview", async ({ page }) => {
  await page.route(`${apiUrl}/admin/tenant/branding`, async (route) => {
    if (route.request().method() === "PATCH") {
      expect(route.request().postDataJSON()).toEqual({
        displayName: "Studio Norte",
        primaryColor: "#16a34a",
      });
      await route.fulfill({ json: { displayName: "Studio Norte", primaryColor: "#16a34a" } });
      return;
    }

    await route.fulfill({ json: { displayName: "Studio Centro", primaryColor: "#2563eb" } });
  });

  await page.goto("/admin/branding");
  await expect(page.getByText("Studio Centro").last()).toBeVisible();
  await page.getByLabel("Nome exibido").fill("Studio Norte");
  await page.getByLabel("Cor primaria hex").fill("#16a34a");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Studio Norte").last()).toBeVisible();
});

function service(input: {
  id: string;
  name?: string;
  isActive?: boolean;
}): Record<string, unknown> {
  return {
    id: input.id,
    tenantId,
    name: input.name ?? "Barba",
    durationMinutes: 45,
    priceCents: 8000,
    isActive: input.isActive ?? true,
    createdAt: "2026-05-01T12:00:00.000Z",
    updatedAt: "2026-05-01T12:00:00.000Z",
  };
}

function workingHour(input: {
  id: string;
  startMinutes: number;
  endMinutes: number;
}): Record<string, unknown> {
  return {
    id: input.id,
    tenantId,
    weekday: 1,
    startMinutes: input.startMinutes,
    endMinutes: input.endMinutes,
    isActive: true,
    createdAt: "2026-05-01T12:00:00.000Z",
    updatedAt: "2026-05-01T12:00:00.000Z",
  };
}

function block(input: { id: string; reason: string }): Record<string, unknown> {
  return {
    id: input.id,
    tenantId,
    startsAt: "2026-05-05T12:00:00.000Z",
    endsAt: "2026-05-05T13:00:00.000Z",
    reason: input.reason,
    createdAt: "2026-05-01T12:00:00.000Z",
    updatedAt: "2026-05-01T12:00:00.000Z",
  };
}
