import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/http-exception.filter";
import { getCorsAllowedOrigins } from "./common/cors";
import { ensureServerEnv } from "./common/server-env";

ensureServerEnv();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");

  // Security headers (OWASP best practice)
  app.use(helmet());
  app.use(cookieParser());

  app.enableCors({
    origin: process.env.NODE_ENV === "production" ? getCorsAllowedOrigins() : true,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle("TKE RAG Chatbot API")
    .setDescription("Backend API for the Tsinghua School of Software RAG chatbot")
    .setVersion("1.0")
    .addCookieAuth("tke-session")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Backend running on port ${port}`);
}

bootstrap();
