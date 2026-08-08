import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
  Optional,
} from '@nestjs/common';
import {
  CIRCUIT_BREAKER_TOKEN,
  HEALTH_SNAPSHOT_STORE_TOKEN,
  ICircuitBreakerService,
  IHealthSnapshotStore,
  SourceHealth,
} from '@ever-jobs/models';

/**
 * Spec 005 / Phase 5 / T09 — periodic health-snapshot persister.
 *
 * Wakes every {@link DEFAULT_HEALTH_SNAPSHOT_INTERVAL_MS} (60 s),
 * reads `breaker.list()`, and persists the resulting
 * `SourceHealth[]` via {@link IHealthSnapshotStore.putBatch}. Both
 * dependencies are `@Optional()`-injected so the cron is a no-op
 * when either is unbound — matching Spec 005 / FR-8's "best-effort"
 * + "bypass when no store" wording exactly.
 *
 * Q-020 / Option A locks in two design choices:
 *   1. **`setInterval` (not `@nestjs/schedule`).** Spec 005 ships
 *      one timer; adding a 1.4 MB dep tree for a single
 *      `setInterval(60_000)` is over-investment. The provider
 *      stores the `NodeJS.Timeout` handle in a private field and
 *      calls `clearInterval(...)` in `onApplicationShutdown()` so
 *      the process exits cleanly under SIGTERM.
 *   2. **`OnApplicationBootstrap` (not `OnModuleInit`).** Fires
 *      AFTER every module's `onModuleInit` — including
 *      {@link import('./plugin-policy.bootstrapper').PluginPolicyBootstrapper}
 *      from T08, which pushes per-plugin policy overrides into the
 *      breaker. This means the first `breaker.list()` snapshot
 *      already reflects every plugin's policy.
 *
 * Persistence failures are caught and logged at `warn` — the next
 * tick re-attempts. A persistent backend outage NEVER takes the
 * cron offline; it just produces a stream of warn-level log lines
 * the operator can alert on. The cron itself never throws.
 *
 * Empty `breaker.list()` results in zero `putBatch` calls (the
 * interface contract MUSTs an empty-input short-circuit; this
 * cron honours it explicitly to avoid a wasted round-trip).
 */

/**
 * Default interval between cron ticks, milliseconds. Matches Spec
 * 005 / FR-8's "every 60 s" exactly. Exposed as a token so tests
 * can inject a shorter value via `Test.createTestingModule(...)`.
 */
export const DEFAULT_HEALTH_SNAPSHOT_INTERVAL_MS = 60_000;

/**
 * DI token for the cron's interval (test seam). Production binds
 * the constant {@link DEFAULT_HEALTH_SNAPSHOT_INTERVAL_MS}; tests
 * override with e.g. `50` for fast jest-fake-timer ticks.
 */
export const HEALTH_SNAPSHOT_INTERVAL_TOKEN = 'HEALTH_SNAPSHOT_INTERVAL_MS';

/**
 * Error code recorded in the warn log when {@link IHealthSnapshotStore.putBatch}
 * rejects with a bare `Error` (no structured `.code`). Distinct
 * from Spec 004 §7.3's well-known store codes so log queries can
 * grep `ERR_HEALTH_SNAPSHOT_PERSIST_FAILED` specifically when
 * triaging cron-side persistence drops.
 */
export const ERR_HEALTH_SNAPSHOT_PERSIST_FAILED =
  'ERR_HEALTH_SNAPSHOT_PERSIST_FAILED';

@Injectable()
export class HealthSnapshotCron
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(HealthSnapshotCron.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    @Optional()
    @Inject(CIRCUIT_BREAKER_TOKEN)
    private readonly breaker: ICircuitBreakerService | undefined,
    /**
     * The `null` arm covers the production wiring path:
     * `StoreModule.forActive` runtime-checks every active store
     * against {@link import('@ever-jobs/models').isHealthSnapshotStore}
     * and binds `null` for backends that don't satisfy the contract
     * (Spec 005 / T09 — sqlite-drizzle / postgres-prisma return
     * `null`; the in-memory backend returns its own instance).
     * `undefined` covers test bootstraps that don't import
     * `StoreModule` at all.
     */
    @Optional()
    @Inject(HEALTH_SNAPSHOT_STORE_TOKEN)
    private readonly store: IHealthSnapshotStore | null | undefined,
    @Optional()
    @Inject(HEALTH_SNAPSHOT_INTERVAL_TOKEN)
    private readonly intervalMs: number = DEFAULT_HEALTH_SNAPSHOT_INTERVAL_MS,
  ) {}

  /**
   * NestJS lifecycle hook. Runs once after every module's
   * `onModuleInit` has completed — so the breaker has already been
   * populated by `PluginPolicyBootstrapper` (T08). Schedules the
   * recurring tick. `unref()`s the handle so a stuck cron never
   * keeps the Node process alive past its work.
   */
  onApplicationBootstrap(): void {
    if (!this.breaker || !this.store) {
      // FR-8: bypass when no store. Logging at `log` level so
      // operators see in startup logs whether persistence is
      // active — silent skip would leave them guessing.
      this.logger.log(
        `Health snapshot persistence disabled — ${
          !this.breaker ? 'no CIRCUIT_BREAKER_TOKEN bound' : ''
        }${!this.breaker && !this.store ? '; ' : ''}${
          !this.store ? 'no HEALTH_SNAPSHOT_STORE_TOKEN bound' : ''
        }.`,
      );
      return;
    }

    const interval = this.normaliseInterval(this.intervalMs);
    this.logger.log(
      `Health snapshot persistence enabled (interval ${interval} ms).`,
    );
    this.timer = setInterval(() => void this.snapshot(), interval);
    // Don't keep the event loop alive solely for the cron.
    if (typeof this.timer === 'object' && this.timer !== null) {
      const t = this.timer as { unref?: () => void };
      if (typeof t.unref === 'function') {
        t.unref();
      }
    }
  }

  /**
   * NestJS lifecycle hook. Runs before HTTP listener teardown.
   * Stops the interval cleanly so an in-flight `putBatch()` isn't
   * abandoned mid-write. Idempotent — calling twice is a no-op.
   */
  onApplicationShutdown(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * Run one snapshot pass. Public so tests can drive a single
   * tick without spinning the timer; production code never calls
   * this directly.
   *
   * Behaviour:
   *  - `breaker` or `store` unbound → resolves to `{ persisted: false,
   *    reason: 'no-binding' }` without invoking either. (Defensive:
   *    the constructor's `@Optional()` already gates the timer
   *    setup, but a future caller wiring the cron without the
   *    bootstrap hook is safe too.)
   *  - `breaker.list()` empty → resolves to `{ persisted: true,
   *    inserted: 0 }` without calling `putBatch` (the interface
   *    contract MUSTs an empty-input short-circuit; we honour it
   *    explicitly to avoid the wasted call).
   *  - `putBatch` rejects → caught, logged at `warn`, resolves to
   *    `{ persisted: false, reason: 'putBatch-rejected', error: { code,
   *    message } }`. NEVER re-throws — a persistent backend outage
   *    must NEVER take the cron offline.
   *  - Happy path → resolves to `{ persisted: true, inserted }`.
   */
  async snapshot(): Promise<HealthSnapshotResult> {
    if (!this.breaker || !this.store) {
      return { persisted: false, reason: 'no-binding' };
    }

    let snapshots: ReadonlyArray<SourceHealth>;
    try {
      snapshots = this.breaker.list();
    } catch (err) {
      // breaker.list() doesn't throw under normal operation, but
      // a custom implementation could. Treat as a warn and skip
      // — the next tick will retry.
      const { code, message } = projectError(err);
      this.logger.warn(
        `breaker.list() threw [${code}] ${message}; skipping tick.`,
      );
      return {
        persisted: false,
        reason: 'list-threw',
        error: { code, message },
      };
    }

    if (snapshots.length === 0) {
      return { persisted: true, inserted: 0 };
    }

    const ts = new Date();
    try {
      const { inserted } = await this.store.putBatch(snapshots, ts);
      return { persisted: true, inserted };
    } catch (err) {
      const { code, message } = projectError(err);
      this.logger.warn(
        `Health snapshot putBatch rejected [${code}] ${message}; ` +
          `${snapshots.length} row(s) dropped this tick.`,
      );
      return {
        persisted: false,
        reason: 'putBatch-rejected',
        error: { code, message },
      };
    }
  }

  /**
   * Validate the interval value. Negative / zero / NaN values fall
   * back to the default — silent normalisation matches the
   * "best-effort" posture (a misconfigured interval value MUST NOT
   * abort startup; the cron just runs at the default cadence).
   */
  private normaliseInterval(raw: number): number {
    if (
      typeof raw !== 'number' ||
      !Number.isFinite(raw) ||
      raw <= 0
    ) {
      return DEFAULT_HEALTH_SNAPSHOT_INTERVAL_MS;
    }
    return raw;
  }
}

/**
 * Outcome of a single {@link HealthSnapshotCron.snapshot} pass.
 * Returned to the test seam so jest can assert exact behaviour
 * per branch; production code never inspects this value (the
 * timer ignores the resolved value).
 */
export type HealthSnapshotResult =
  | { persisted: true; inserted: number }
  | {
      persisted: false;
      reason: 'no-binding' | 'list-threw' | 'putBatch-rejected';
      error?: { code: string; message: string };
    };

/**
 * Project an unknown thrown value into a stable `{ code, message }`
 * shape for log lines + `HealthSnapshotResult.error`. Mirrors the
 * pattern in `JobsAggregator.maybePersist` (Spec 004 / T11): if the
 * thrown error carries a structured `.code`, surface it; otherwise
 * fall back to {@link ERR_HEALTH_SNAPSHOT_PERSIST_FAILED}.
 */
function projectError(err: unknown): { code: string; message: string } {
  if (err instanceof Error) {
    const candidate = (err as Error & { code?: string }).code;
    return {
      code:
        typeof candidate === 'string' && candidate.length > 0
          ? candidate
          : ERR_HEALTH_SNAPSHOT_PERSIST_FAILED,
      message: err.message,
    };
  }
  return {
    code: ERR_HEALTH_SNAPSHOT_PERSIST_FAILED,
    message: String(err),
  };
}
