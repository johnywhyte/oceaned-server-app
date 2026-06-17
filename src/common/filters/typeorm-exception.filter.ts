import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TypeOrmExceptionFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const { message } = exception;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorMessage = 'Database error occurred';

    // Handle specific database errors
    if (message.includes('Duplicate entry')) {
      status = HttpStatus.CONFLICT;
      errorMessage = 'Resource already exists';
    } else if (message.includes('foreign key constraint')) {
      status = HttpStatus.BAD_REQUEST;
      errorMessage = 'Referenced resource does not exist';
    } else if (message.includes('cannot be null')) {
      status = HttpStatus.BAD_REQUEST;
      errorMessage = 'Required field is missing';
    }

    this.logger.error(`Database Error: ${message}`);

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      message: errorMessage,
      error: 'Database Error',
    });
  }
}