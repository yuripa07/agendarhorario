import { BadRequestException } from "@nestjs/common";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ZodValidationPipe } from "./zod-validation.pipe.js";

describe("ZodValidationPipe", () => {
  it("validates with an explicit schema", () => {
    const pipe = new ZodValidationPipe(z.object({ name: z.string().min(1) }));

    expect(pipe.transform({ name: "Service" }, { type: "body" })).toEqual({ name: "Service" });
  });

  it("rejects invalid explicit schema input", () => {
    const pipe = new ZodValidationPipe(z.object({ name: z.string().min(1) }));

    expect(() => pipe.transform({ name: "" }, { type: "body" })).toThrow(BadRequestException);
  });
});
