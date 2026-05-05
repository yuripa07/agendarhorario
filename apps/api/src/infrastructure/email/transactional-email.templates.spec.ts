import { describe, expect, it } from "vitest";
import { renderEmailTemplate } from "./email-template.renderer.js";
import {
  bookingCanceledEmail,
  bookingCreatedEmail,
  bookingRescheduledEmail,
  passwordResetEmail,
} from "./transactional-email.templates.js";

describe("transactional email templates", () => {
  it("renders password reset content without leaking through logs", async () => {
    const template = passwordResetEmail({
      resetUrl: "https://app.example.com/reset?token=secret-token",
    });

    const rendered = await renderEmailTemplate(template.subject, template.node);

    expect(rendered.subject).toBe("Redefinicao de senha");
    expect(rendered.html).toContain("Redefinir senha");
    expect(rendered.text).toContain("https://app.example.com/reset?token=secret-token");
  });

  it("renders booking creation with service, date and management link", async () => {
    const template = bookingCreatedEmail({
      customerName: "Maria Silva",
      serviceName: "Corte masculino",
      startsAt: new Date("2026-05-04T12:00:00.000Z"),
      timezone: "America/Sao_Paulo",
      managementUrl: "https://app.example.com/booking/manage?token=booking-token",
    });

    const rendered = await renderEmailTemplate(template.subject, template.node);

    expect(rendered.subject).toBe("Agendamento confirmado");
    expect(rendered.text).toContain("Maria Silva");
    expect(rendered.text).toContain("Corte masculino");
    expect(rendered.text).toContain("segunda-feira");
    expect(rendered.text).toContain("09:00");
    expect(rendered.text).toContain("https://app.example.com/booking/manage?token=booking-token");
  });

  it("renders booking cancellation and reschedule without service when absent", async () => {
    const canceled = bookingCanceledEmail({
      customerName: "Ana Souza",
      startsAt: new Date("2026-05-04T13:00:00.000Z"),
      timezone: "America/Sao_Paulo",
    });
    const rescheduled = bookingRescheduledEmail({
      customerName: "Ana Souza",
      startsAt: new Date("2026-05-04T14:00:00.000Z"),
      timezone: "America/Sao_Paulo",
    });

    await expect(renderEmailTemplate(canceled.subject, canceled.node)).resolves.toMatchObject({
      subject: "Agendamento cancelado",
    });

    const renderedReschedule = await renderEmailTemplate(rescheduled.subject, rescheduled.node);
    expect(renderedReschedule.subject).toBe("Agendamento remarcado");
    expect(renderedReschedule.text).not.toContain("Servico:");
  });
});
