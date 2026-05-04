import { describe, expect, it, vi } from "vitest";
import { ResendEmailMessageSender } from "./resend-email-message.sender.js";

describe("ResendEmailMessageSender", () => {
  it("sends transactional email through Resend", async () => {
    const emails = {
      send: vi.fn().mockResolvedValue({ data: { id: "email-1" }, error: null }),
    };
    const sender = new ResendEmailMessageSender(emails, "Agendar <no-reply@example.com>");

    await sender.send({
      to: "maria@example.com",
      subject: "Agendamento confirmado",
      html: "<p>Confirmado</p>",
      text: "Confirmado",
    });

    expect(emails.send).toHaveBeenCalledWith({
      from: "Agendar <no-reply@example.com>",
      to: "maria@example.com",
      subject: "Agendamento confirmado",
      html: "<p>Confirmado</p>",
      text: "Confirmado",
    });
  });
});
