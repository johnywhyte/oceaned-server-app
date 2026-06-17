import { ValidationPipe as NestValidationPipe, ValidationError } from '@nestjs/common';
import { BadRequestException } from '@nestjs/common';

export class ValidationPipe extends NestValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors.map(error => ({
          field: error.property,
          errors: Object.values(error.constraints || {}),
        }));

        return new BadRequestException({
          success: false,
          message: 'Validation failed',
          errors: messages,
        });
      },
    });
  }
}