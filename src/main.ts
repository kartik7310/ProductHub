import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000);

  //global prefix
  app.setGlobalPrefix('api/v1');

  //global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:true,
      forbidNonWhitelisted:true,
      transform:true,
      transformOptions:{
        enableImplicitConversion:true
      }
    })
  )

  //enalbe cors
 
  app.enableCors({
    origin:process.env.CORS_ORIGIN?.split(',')??"http://localhost:3000",
    credentials:true,
    methods:['GET','POST','PUT','DELETE','PATCH'],
    allowedHeaders:['Content-Type','Authorization']
  })

  //enable swager documentation

  const config = new DocumentBuilder()
  .setTitle('E-Commerce API')
  .setDescription('E-Commerce API documentation')
  .setVersion('1.0')
  .addTag('auth')
  const document = SwaggerModule.createDocument(app,config);
  SwaggerModule.setup('api',app,document,{
    swaggerOptions:{
      persistAuthorization:true,
      tagsSorter:'alpha',
      operationsSorter:'alpha',
      
    },
    customSiteTitle:'E-Commerce API',
    customfavIcon:'https://swagger.io/favicon.ico', 
  });
}


bootstrap().catch((error)=>{
  Logger.error("Error starting the application",error);
  process.exit(1);
});
