import {
  Inject,
  Injectable,
  Logger,
  OnApplicationBootstrap,
  Optional,
} from '@nestjs/common';
import {
  CIRCUIT_BREAKER_TOKEN,
  hasCircuitBreakerPolicy,
  ICircuitBreakerService,
  Site,
} from '@ever-jobs/models';
import { PluginRegistry } from '@ever-jobs/plugin';

/**
 * Spec 005 / T08 — discovery-side wiring for per-plugin
 * `getCircuitBreakerPolicy()` overrides (FR-3).
 *
 * `ICircuitBreakerService.setPolicy(site, policy)` and
 * `ICircuitBreakerPolicyProvider` are already in place from T01/T02 — this
 * bootstrapper is the missing link that *discovers* plugins implementing
 * the optional policy provider and pushes their override into the breaker
 * before the first scrape() call.
 *
 * **Why a separate provider** (mirroring the T06 `MetricsCircuitBreakerBridge`
 * pattern) — `CircuitBreakerModule` is intentionally standalone and unaware
 * of `PluginRegistry`; teaching it to scan the registry would create a
 * back-edge that breaks AGENTS.md §0.2's "every plugin replaceable"
 * invariant (a custom breaker plugged in via `CIRCUIT_BREAKER_TOKEN` would
 * silently lose policy overrides). The bootstrapper owns *both*
 * dependencies and is mounted by `JobsModule`, where they both already
 * resolve.
 *
 * **Lifecycle.** Runs in `OnApplicationBootstrap`, which fires *after*
 * every module's `OnModuleInit`. `PluginDiscoveryService` populates
 * `PluginRegistry` during its `OnModuleInit`, so by the time we run, every
 * `@SourcePlugin()`-decorated provider has already been registered. No
 * race window; no need for retries.
 *
 * **Back-compat.** Both deps are `@Optional()`. When the breaker isn't
 * bound (test bootstraps that don't import `CircuitBreakerModule`) the
 * bootstrapper is a no-op. When the registry isn't bound (impossible in
 * production — `PluginModule` is global — but possible in narrow unit
 * suites) the bootstrapper logs and skips.
 *
 * **One-shot semantics.** Plugins registered *after* bootstrap (community
 * plugins via `PluginRegistry.registerExternal`) are not seen by this
 * pass. Callers wiring runtime plugins should either:
 *   - call `breaker.setPolicy(site, policy)` themselves after registering, or
 *   - re-trigger `applyPluginPolicies()` (the public method below) — added
 *     so future tasks can hot-swap plugins without writing a new bootstrapper.
 *
 * Q-016 records the design choices.
 */
@Injectable()
export class PluginPolicyBootstrapper implements OnApplicationBootstrap {
  private readonly logger = new Logger(PluginPolicyBootstrapper.name);

  constructor(
    @Optional() private readonly registry?: PluginRegistry,
    @Optional()
    @Inject(CIRCUIT_BREAKER_TOKEN)
    private readonly breaker?: ICircuitBreakerService,
  ) {}

  onApplicationBootstrap(): void {
    this.applyPluginPolicies();
  }

  /**
   * Public entry point — also callable by tests / hot-swap paths after the
   * application has already booted. Returns the list of `Site`s whose
   * policy was actually overridden so callers can log or assert.
   */
  applyPluginPolicies(): Site[] {
    if (!this.breaker) {
      this.logger.warn(
        'No circuit-breaker bound under CIRCUIT_BREAKER_TOKEN; skipping per-plugin policy discovery',
      );
      return [];
    }
    if (!this.registry) {
      this.logger.warn(
        'No PluginRegistry bound; skipping per-plugin policy discovery',
      );
      return [];
    }

    const overridden: Site[] = [];
    for (const site of this.registry.listSiteKeys()) {
      const scraper = this.registry.getScraper(site);
      if (!scraper) continue;
      if (!hasCircuitBreakerPolicy(scraper)) continue;
      try {
        const policy = scraper.getCircuitBreakerPolicy();
        this.breaker.setPolicy(site, policy);
        overridden.push(site);
        this.logger.log(
          `applyPluginPolicies: ${site} → ${JSON.stringify(policy)}`,
        );
      } catch (err) {
        // A throw inside getCircuitBreakerPolicy() must NOT take the rest
        // of the app down — the plugin gets the default policy instead.
        const message =
          err instanceof Error ? err.message : String(err);
        this.logger.error(
          `applyPluginPolicies: ${site} threw in getCircuitBreakerPolicy(); falling back to default — ${message}`,
        );
      }
    }

    if (overridden.length === 0) {
      this.logger.log(
        'applyPluginPolicies: no plugin overrode the default circuit-breaker policy',
      );
    } else {
      this.logger.log(
        `applyPluginPolicies: applied ${overridden.length} per-plugin policy override(s)`,
      );
    }
    return overridden;
  }
}
