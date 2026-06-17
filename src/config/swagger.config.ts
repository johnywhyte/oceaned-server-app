import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export const setupSwagger = (app: INestApplication, configService: ConfigService): void => {
  const config = new DocumentBuilder()
    .setTitle('OCEANED API')
    .setDescription('OCEANED Application Management System API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('roles', 'Role management')
    .addTag('profiles', 'User profile management')
    .addTag('schools', 'School management')
    .addTag('applications', 'Application management')
    .addTag('documents', 'Document management')
    .addTag('payments', 'Payment management')
    .addTag('recommendations', 'Recommendation management')
    .addTag('notifications', 'Notification management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  console.log(
    `📚 Swagger documentation available at: http://localhost:${configService.get('PORT', 8000)}/api/docs`,
  );
};