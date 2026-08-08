import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  CIRCUIT_BREAKER_TOKEN,
  ICircuitBreakerService,
  Site,
} from '@ever-jobs/models';
import { CircuitBreakerService } from './circuit-breaker.service';

/**
 * Programmatic interceptor — Spec 005 / FR-1 / T03.
 *
 * **Why a class and not a NestJS `NestInterceptor`?** The breaker's natural
 * interception point is **per-source** (each plugin's `IScraper.scrape()`
 * call), not **per-HTTP-request**. A `NestInterceptor` would only see the
 * controller boundary — it has no view into which site a fan-out is
 * dispatching to. So this class exposes a small `wrap(site, fn)` facade
 * that the aggregator (T04) consumes when fanning out to N plugins. If we
 * later need an HTTP-level interceptor it can be added alongside this
 * one without changing the contract.
 *
 * The interceptor itself does NOT host policy or state — it delegates
 * everything to {@link ICircuitBreakerService} so the underlying engine
 * stays swappable per AGENTS.md §0.2.
 */
@Injectable()
export class CircuitBreakerInterceptor {
  constructor(
    @Optional()
    @Inject(CIRCUIT_BREAKER_TOKEN)
    private readonly injectedBreaker?: ICircuitBreakerService,
    @Optional() private readonly fallbackBreaker?: CircuitBreakerService,
  ) {}

  /** Resolve the active breaker — token binding wins over class binding. */
  private get breaker(): ICircuitBreakerService {
    const b = this.injectedBreaker ?? this.fallbackBreaker;
    if (!b) {
      throw new Error(
        'CircuitBreakerInterceptor: no ICircuitBreakerService bound under CIRCUIT_BREAKER_TOKEN',
      );
    }
    return b;
  }

  /**
   * Wrap `fn` under the breaker for `site`. If the circuit is open the
   * call is short-circuited with a `Error` whose `code` is
   * `ERR_SOURCE_CIRCUIT_OPEN`. Otherwise the original promise is
   * returned (success or rejection) — the interceptor records the
   * outcome on the way through.
   */
  wrap<T>(site: Site, fn: () => Promise<T>): Promise<T> {
    return this.breaker.exec(site, fn);
  }
}
