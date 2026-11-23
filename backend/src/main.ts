import { Logger, StandardSchemaValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: (process.env.FRONTEND_URL ?? 'http://localhost:3000').split(','),
    credentials: true,
  });
  app.useGlobalPipes(new StandardSchemaValidationPipe());

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  Logger.log(`API ready on http://localhost:${port}/api`, 'Bootstrap');
}
await bootstrap();
