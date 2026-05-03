import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import helmet from "helmet";
import { Logger as PinoLogger } from "nestjs-pino";
import { AppModule } from "./presentation/app.module.js";
import { ZodValidationPipe } from "./presentation/pipes/zod-validation.pipe.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false, bufferLogs: true });
  const config = app.get(ConfigService);

  app.useLogger(app.get(PinoLogger));
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
        },
      },
      hsts: config.get("NODE_ENV") === "production",
      frameguard: { action: "deny" },
    }),
  );
  app.enableCors({
    origin: config.getOrThrow<string>("WEB_ORIGIN"),
    credentials: true,
  });
  app.useGlobalPipes(new ZodValidationPipe());

  const port = config.getOrThrow<number>("PORT");
  await app.listen(port, "0.0.0.0");
  Logger.log(`API listening on port ${port}`, "Bootstrap");
}

void bootstrap();
