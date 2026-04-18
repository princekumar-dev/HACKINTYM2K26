import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

function isMongoConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === 'MongoServerSelectionError' ||
    (error.message.includes('ECONNREFUSED') && error.message.includes('27017'))
  );
}

process.on('unhandledRejection', (reason) => {
  if (isMongoConnectionError(reason)) {
    console.warn('MongoDB is unavailable. Backend will continue without database connectivity.');
    return;
  }

  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  if (isMongoConnectionError(error)) {
    console.warn('MongoDB is unavailable. Backend will continue without database connectivity.');
    return;
  }

  console.error('Uncaught exception:', error);
  process.exit(1);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Swagger/OpenAPI setup
  const config = new DocumentBuilder()
    .setTitle('HackintyM2K26 Backend API')
    .setDescription('Performance monitoring and code analysis API')
    .setVersion('1.0.0')
    .addTag('Monitoring', 'URL and website monitoring endpoints')
    .addTag('Analysis', 'Code analysis endpoints')
    .addTag('Features', 'Feature comparison and injection endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`✅ Backend server is running on port ${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
