import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { serverEnv } from '@enxoval/env/server';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: serverEnv.TRUSTED_ORIGINS,
    credentials: true,
  });

  await app.listen(serverEnv.PORT);
  console.log(`🚀 Enxoval API running on http://localhost:${serverEnv.PORT}`);
}

bootstrap();

