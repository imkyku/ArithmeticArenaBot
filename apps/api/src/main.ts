import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
<<<<<<< HEAD
import { AppModule } from './app.module.js';
=======
import { AppModule } from './app.module';
>>>>>>> main
import { ConfigService } from '@nestjs/config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.enableCors({ origin: config.get<string>('CORS_ORIGIN', '*'), credentials: true });

  await app.listen(config.get<number>('PORT', 3000));
}

bootstrap();
