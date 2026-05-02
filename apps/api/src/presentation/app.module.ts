import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { envSchema } from "../infrastructure/config/env.schema.js";
import { DatabaseModule } from "../infrastructure/database/database.module.js";
import { redact } from "../infrastructure/logger/redact.js";
import { HealthModule } from "./health/health.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: (rawConfig) => envSchema.parse(rawConfig),
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? "info",
        redact: {
          paths: ["req.headers.authorization", "req.headers.cookie", "password", "token"],
          censor: "[redacted]",
        },
        serializers: {
          req: (request) => redact(request),
          res: (response) => response,
        },
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    DatabaseModule,
    HealthModule,
  ],
})
export class AppModule {}
