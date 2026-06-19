import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { join } from 'path';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(
    helmet({
      // Allow images served from /uploads to be embedded cross-origin
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Serve locally-stored uploads (blog images, etc.) from /uploads
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  app.setGlobalPrefix('api/v1');

  // Allow one or more frontend origins (comma-separated in FRONTEND_URL),
  // plus localhost for development. e.g.
  // FRONTEND_URL=https://oceanedconsults.com,https://www.oceanedconsults.com,https://oceaned.vercel.app
  const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const localhostRegex = /^http:\/\/localhost(:\d+)?$/;

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser clients (curl/server-to-server) with no Origin.
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || localhostRegex.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseTransformInterceptor(),
  );

if (process.env.NODE_ENV !== 'production') {
  const config = new DocumentBuilder()
    .setTitle('OCEANED API')
    .setDescription(
      'API documentation for the OCEANED School Management Module. ' +
        'Manages schools, degree programs, and related operations for the study-abroad platform.',
    )
    .setVersion('1.0.0')
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
    .addTag('Authentication', 'User authentication and authorization endpoints')
    .addTag(
      'Schools',
      'School management operations (CRUD, logo upload, status toggle)',
    )
    .addTag(
      'Programs',
      'Degree program management (CRUD, filtering, status toggle)',
    )
    .addTag('Users', 'User management operations')
    .addTag('Applications', 'Student application lifecycle management')
    .addTag('Documents', 'Document upload and verification')
    .addTag('Payments', 'Payment processing and tracking')
    .addTag('Recommendations', 'Admin recommendation system')
    .addTag('Notifications', 'User notification management')
    .addTag('Dashboard', 'Student dashboard data')
    .addTag('Scholarships', 'Scholarship listing, filtering and management')
    .addTag(
      'Lookups',
      'Dropdown data for countries, degree types and fields of study',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}

  const port = process.env.PORT || 8002; 
  await app.listen(port);

  console.log(`                                                    
 OCEANED School Management API                                                                    
    Server Status:  Running                                   
    Environment: ${process.env.NODE_ENV || 'development'}                                                                                                     
    Application URL: http://localhost:${port}                   
    API Documentation: http://localhost:${port}/api/docs                                                                                   
  `);
}

void bootstrap();
