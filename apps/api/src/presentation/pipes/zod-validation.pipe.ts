import {
  type ArgumentMetadata,
  BadRequestException,
  Injectable,
  type PipeTransform,
} from "@nestjs/common";
import type { ZodError, ZodSchema } from "zod";

@Injectable()
export class ZodValidationPipe implements PipeTransform<unknown, unknown> {
  constructor(private readonly schema?: ZodSchema) {}

  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const schema: unknown = this.schema ?? metadata.metatype;

    if (!isZodSchema(schema)) {
      return value;
    }

    const result = schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException(formatZodError(result.error));
    }

    return result.data;
  }
}

function isZodSchema(value: unknown): value is ZodSchema {
  return Boolean(value && typeof value === "object" && "safeParse" in value);
}

function formatZodError(error: ZodError): string {
  return error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
}
