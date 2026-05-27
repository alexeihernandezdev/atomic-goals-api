import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '../../shared/domain/errors/domain.error';
import { NotFoundError } from '../../shared/domain/errors/not-found.error';
import { ConflictError } from '../../shared/domain/errors/conflict.error';
import { ValidationError } from '../../shared/domain/errors/validation.error';
import { ForbiddenError } from '../../shared/domain/errors/forbidden.error';

@Catch(DomainError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = this.resolveStatus(exception);

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: exception.name,
    });
  }

  private resolveStatus(exception: DomainError): number {
    if (exception instanceof NotFoundError) return HttpStatus.NOT_FOUND;
    if (exception instanceof ConflictError) return HttpStatus.CONFLICT;
    if (exception instanceof ValidationError)
      return HttpStatus.UNPROCESSABLE_ENTITY;
    if (exception instanceof ForbiddenError) return HttpStatus.FORBIDDEN;
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
