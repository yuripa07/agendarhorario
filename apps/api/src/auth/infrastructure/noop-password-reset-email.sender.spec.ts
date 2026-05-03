import { Logger } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoopPasswordResetEmailSender } from "./noop-password-reset-email.sender.js";

describe("NoopPasswordResetEmailSender", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("logs only the recipient and never the reset URL", async () => {
    const log = vi.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    const sender = new NoopPasswordResetEmailSender();

    await sender.send({
      to: "admin@example.com",
      resetUrl: "https://api.example.com/auth/reset-password/token-secret",
    });

    expect(log).toHaveBeenCalledWith("Password reset email stub invoked for admin@example.com");
    expect(log).not.toHaveBeenCalledWith(expect.stringContaining("token-secret"));
  });
});
