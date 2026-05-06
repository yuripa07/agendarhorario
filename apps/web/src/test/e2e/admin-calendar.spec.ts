import { expect, test } from "@playwright/test";

const apiUrl = "http://127.0.0.1:3000";
const appointmentId = "22222222-2222-4222-8222-222222222222";
const tenantId = "33333333-3333-4333-8333-333333333333";
const serviceId = "11111111-1111-4111-8111-111111111111";

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
          id: appointmentId,
          tenantId,
          serviceId,
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

test("admin creates, reschedules and cancels appointments from the calendar", async ({ page }) => {
  await page.route(`${apiUrl}/admin/session`, async (route) => {
    await route.fulfill({
      json: { user: { email: "admin@example.com", name: "Admin" } },
    });
  });

  await page.route(`${apiUrl}/admin/services`, async (route) => {
    await route.fulfill({
      json: [
        {
          id: serviceId,
          tenantId,
          name: "Consulta",
          durationMinutes: 60,
          priceCents: 12000,
          isActive: true,
          createdAt: "2026-05-01T12:00:00.000Z",
          updatedAt: "2026-05-01T12:00:00.000Z",
        },
      ],
    });
  });

  await page.route(`${apiUrl}/admin/calendar/services/${serviceId}/slots**`, async (route) => {
    await route.fulfill({
      json: [
        {
          startsAt: "2026-05-05T12:00:00.000Z",
          endsAt: "2026-05-05T13:00:00.000Z",
          score: 0,
          isAdjacent: false,
        },
        {
          startsAt: "2026-05-05T13:00:00.000Z",
          endsAt: "2026-05-05T14:00:00.000Z",
          score: 1,
          isAdjacent: false,
        },
      ],
    });
  });

  await page.route(`${apiUrl}/admin/calendar/appointments**`, async (route) => {
    if (route.request().method() === "POST") {
      expect(route.request().postDataJSON()).toEqual({
        serviceId,
        startsAt: "2026-05-05T12:00:00.000Z",
        customerName: "Novo Cliente",
        customerEmail: "novo@example.com",
        customerPhone: "+5511555555555",
      });
      await route.fulfill({
        json: appointment({
          id: "55555555-5555-4555-8555-555555555555",
          customerName: "Novo Cliente",
          startsAt: "2026-05-05T12:00:00.000Z",
          endsAt: "2026-05-05T13:00:00.000Z",
        }),
      });
      return;
    }

    await route.fulfill({
      json: [
        appointment({
          id: appointmentId,
          customerName: "Maria Silva",
          startsAt: "2026-05-05T12:00:00.000Z",
          endsAt: "2026-05-05T13:00:00.000Z",
        }),
      ],
    });
  });

  await page.route(
    `${apiUrl}/admin/calendar/appointments/${appointmentId}/reschedule`,
    async (route) => {
      expect(route.request().postDataJSON()).toEqual({
        startsAt: "2026-05-05T13:00:00.000Z",
      });
      await route.fulfill({
        json: appointment({
          id: appointmentId,
          customerName: "Maria Silva",
          startsAt: "2026-05-05T13:00:00.000Z",
          endsAt: "2026-05-05T14:00:00.000Z",
        }),
      });
    },
  );

  await page.route(
    `${apiUrl}/admin/calendar/appointments/${appointmentId}/cancel`,
    async (route) => {
      await route.fulfill({
        json: appointment({
          id: appointmentId,
          customerName: "Maria Silva",
          startsAt: "2026-05-05T12:00:00.000Z",
          endsAt: "2026-05-05T13:00:00.000Z",
          status: "canceled",
          canceledAt: "2026-05-05T12:30:00.000Z",
        }),
      });
    },
  );

  await page.goto("/admin/calendar?date=2026-05-05");

  await page.getByRole("button", { name: "Novo agendamento" }).click();
  await page.getByRole("radio", { name: "09:00" }).check({ force: true });
  await page.getByLabel("Nome").fill("Novo Cliente");
  await page.getByLabel("Telefone").fill("+5511555555555");
  await page.getByLabel("E-mail").fill("novo@example.com");
  await page.getByRole("button", { name: "Criar agendamento" }).click();

  await page.getByRole("button", { name: "Remarcar" }).click();
  await page.getByRole("radio", { name: "10:00" }).check({ force: true });
  await page.getByRole("button", { name: "Salvar remarcacao" }).click();

  await page.getByRole("button", { name: "Cancelar" }).click();
  await page.getByRole("button", { name: "Cancelar agendamento" }).click();
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

function appointment(input: {
  id: string;
  customerName: string;
  startsAt: string;
  endsAt: string;
  status?: "confirmed" | "canceled";
  canceledAt?: string | null;
}): Record<string, unknown> {
  return {
    id: input.id,
    tenantId,
    serviceId,
    serviceName: "Consulta",
    serviceDurationMinutes: 60,
    customerName: input.customerName,
    customerEmail: "maria@example.com",
    customerPhone: "+5511999999999",
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    status: input.status ?? "confirmed",
    canceledAt: input.canceledAt ?? null,
  };
}
