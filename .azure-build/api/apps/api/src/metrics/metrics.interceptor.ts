import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from './metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // GraphQL requests don't have an Express request — skip HTTP metrics
    if (context.getType<string>() === 'graphql') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    
    // Skip metrics endpoint itself to avoid noise
    if (url === '/metrics') {
      return next.handle();
    }

    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;
        const duration = (Date.now() - start) / 1000;

        this.metricsService.httpRequestsTotal.inc({
          method,
          path: url,
          status_code: statusCode,
        });

        this.metricsService.httpRequestDuration.observe(
          { method, path: url },
          duration,
        );
      }),
    );
  }
}
