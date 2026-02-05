import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { error } from 'console';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);

  //global prefix
  app.setGlobalPrefix('api/v1');
}
bootstrap().catch((error)=>{
  Logger.error("Error starting the application",error);
  process.exit(1);
});
