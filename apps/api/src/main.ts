import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: [
      'http://localhost:43122',
      'http://127.0.0.1:43122',
      /^http:\/\/(localhost|127\.0\.0\.1):\d+$/,
    ],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: true,
    }),
  );
  const port = Number(process.env.PORT ?? 43121);
  await app.listen(port, '0.0.0.0');
  console.log(`Mini ERP API 已启动 http://127.0.0.1:${port}/api`);
}

bootstrap();
