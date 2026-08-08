import { Module } from '@nestjs/common';
import { CIRCUIT_BREAKER_TOKEN } from '@ever-jobs/models';
import { CircuitBreakerService } from './circuit-breaker.service';
import { CircuitBreakerInterceptor } from './circuit-breaker.interceptor';

/**
 * Binds the default {@link CircuitBreakerService} under
 * {@link CIRCUIT_BREAKER_TOKEN} and exposes
 * {@link CircuitBreakerInterceptor} for the aggregator (Spec 005 / T04).
 *
 * Consumers (e.g. `JobsModule`) should `imports: [CircuitBreakerModule]`
 * once at the application boundary — the underlying engine is then
 * swappable by replacing this module in tests or alternate deployments.
 */
@Module({
  providers: [
    CircuitBreakerService,
    {
      provide: CIRCUIT_BREAKER_TOKEN,
      useExisting: CircuitBreakerService,
    },
    CircuitBreakerInterceptor,
  ],
  exports: [
    CIRCUIT_BREAKER_TOKEN,
    CircuitBreakerService,
    CircuitBreakerInterceptor,
  ],
})
export class CircuitBreakerModule {}
