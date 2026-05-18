import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { randomUUID } from 'crypto';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('DistributedLogging');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();
    const response = httpContext.getResponse();

    // Propagation of Correlation ID (distributed trace support)
    const correlationId = request.headers['x-correlation-id'] || randomUUID();
    request.correlationId = correlationId;
    response.setHeader('x-correlation-id', correlationId);

    const { method, url, ip, body } = request;
    const startTime = Date.now();

    // Sanitization utility to redact credential details
    const sanitizeBody = (payload: any) => {
      if (!payload) return null;
      if (typeof payload !== 'object') return payload;
      const sanitized = { ...payload };
      const sensitiveKeys = ['password', 'confirmPassword', 'newPassword', 'token'];
      sensitiveKeys.forEach((key) => {
        if (key in sanitized) {
          sanitized[key] = '[REDACTED]';
        }
      });
      return sanitized;
    };

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = response.statusCode;

        this.logger.log(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            correlationId,
            level: 'INFO',
            ip,
            method,
            url,
            statusCode,
            durationMs: duration,
            body: sanitizeBody(body),
          }),
        );
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        const statusCode = error.status || 500;

        this.logger.error(
          JSON.stringify({
            timestamp: new Date().toISOString(),
            correlationId,
            level: 'ERROR',
            ip,
            method,
            url,
            statusCode,
            durationMs: duration,
            body: sanitizeBody(body),
            error: error.message || error,
          }),
        );

        return throwError(() => error);
      }),
    );
  }
}
