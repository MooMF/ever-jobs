/**
 * Unit tests — Spec 005 / T08 — `PluginPolicyBootstrapper`.
 *
 * Drives the bootstrapper directly (no Nest bootstrap) by handing it
 * stub `PluginRegistry` and `ICircuitBreakerService` instances. Tests
 * cover:
 *
 *   1. Plugin without `getCircuitBreakerPolicy()` → no override pushed.
 *   2. Plugin with `getCircuitBreakerPolicy()` → exact policy pushed via
 *      `setPolicy(site, policy)`.
 *   3. Mixed registry → only the override-capable plugins land in the
 *      returned `Site[]`; default policy stays in effect for the rest.
 *   4. A throwing `getCircuitBreakerPolicy()` does not take down the pass —
 *      remaining plugins are still applied. (Defensive against a buggy
 *      plugin author.)
 *   5. Unbound breaker → no-op, returns `[]`, logs a warning.
 *   6. Unbound registry → no-op, returns `[]`, logs a warning.
 *   7. `onApplicationBootstrap` delegates to `applyPluginPolicies`.
 *   8. Late-binding scenario — a plugin registered *after*
 *      bootstrapping is picked up by a manual `applyPluginPolicies()`
 *      re-trigger (the documented hot-swap escape hatch).
 */
import 'reflect-metadata';
import {
  CircuitPolicy,
  ICircuitBreakerPolicyProvider,
  ICircuitBreakerService,
  IScraper,
  JobResponseDto,
  ScraperInputDto,
  Site,
  SourceHealth,
} from '@ever-jobs/models';
import { PluginRegistry } from '@ever-jobs/plugin';
import { PluginPolicyBootstrapper } from '../plugin-policy.bootstrapper';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

class StubBreaker implements ICircuitBreakerService {
  readonly setPolicy = jest.fn<void, [Site, CircuitPolicy]>();
  exec<T>(_: Site, fn: () => Promise<T>): Promise<T> {
    return fn();
  }
  state(): 'closed' {
    return 'closed';
  }
  health(site: Site): SourceHealth {
    return { site, state: 'closed', successRate: 1, p95LatencyMs: 0, windowMs: 60_000 };
  }
  forceOpen(): void {}
  forceReset(): void {}
  list(): SourceHealth[] {
    return [];
  }
}

const POLICY_TIGHT: CircuitPolicy = {
  failureThreshold: 2,
  cooldownMs: 5_000,
  halfOpenProbes: 1,
  rollingWindowMs: 30_000,
};

const POLICY_LAX: CircuitPolicy = {
  failureThreshold: 10,
  cooldownMs: 60_000,
  halfOpenProbes: 2,
  rollingWindowMs: 120_000,
};

function makePlainScraper(): IScraper {
  return {
    scrape: jest.fn(async (_input: ScraperInputDto) => new JobResponseDto([])),
  };
}

function makeOverridingScraper(
  policy: CircuitPolicy,
): IScraper & ICircuitBreakerPolicyProvider {
  return {
    scrape: jest.fn(async () => new JobResponseDto([])),
    getCircuitBreakerPolicy: jest.fn(() => policy),
  };
}

function makeThrowingScraper(): IScraper & ICircuitBreakerPolicyProvider {
  return {
    scrape: jest.fn(async () => new JobResponseDto([])),
    getCircuitBreakerPolicy: jest.fn(() => {
      throw new Error('intentional plugin bug');
    }),
  };
}

function buildRegistry(
  entries: Array<{ site: Site; scraper: IScraper }>,
): PluginRegistry {
  const r = new PluginRegistry();
  for (const { site, scraper } of entries) {
    r.register({ site, name: `${site}-fake`, category: 'job-board', isAts: false }, scraper);
  }
  return r;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PluginPolicyBootstrapper (Spec 005 / T08)', () => {
  it('does not push policy for a plugin without getCircuitBreakerPolicy()', () => {
    const breaker = new StubBreaker();
    const registry = buildRegistry([{ site: Site.LINKEDIN, scraper: makePlainScraper() }]);

    const boot = new PluginPolicyBootstrapper(registry, breaker);
    const overridden = boot.applyPluginPolicies();

    expect(overridden).toEqual([]);
    expect(breaker.setPolicy).not.toHaveBeenCalled();
  });

  it('pushes the exact policy for a plugin that overrides', () => {
    const breaker = new StubBreaker();
    const scraper = makeOverridingScraper(POLICY_TIGHT);
    const registry = buildRegistry([{ site: Site.LINKEDIN, scraper }]);

    const boot = new PluginPolicyBootstrapper(registry, breaker);
    const overridden = boot.applyPluginPolicies();

    expect(overridden).toEqual([Site.LINKEDIN]);
    expect(breaker.setPolicy).toHaveBeenCalledTimes(1);
    expect(breaker.setPolicy).toHaveBeenCalledWith(Site.LINKEDIN, POLICY_TIGHT);
  });

  it('handles a mixed registry and applies only override-capable plugins', () => {
    const breaker = new StubBreaker();
    const overrider = makeOverridingScraper(POLICY_LAX);
    const plain = makePlainScraper();
    const registry = buildRegistry([
      { site: Site.LINKEDIN, scraper: plain },
      { site: Site.INDEED, scraper: overrider },
    ]);

    const boot = new PluginPolicyBootstrapper(registry, breaker);
    const overridden = boot.applyPluginPolicies();

    expect(overridden).toEqual([Site.INDEED]);
    expect(breaker.setPolicy).toHaveBeenCalledTimes(1);
    expect(breaker.setPolicy).toHaveBeenCalledWith(Site.INDEED, POLICY_LAX);
  });

  it('keeps applying remaining plugins when one throws in getCircuitBreakerPolicy()', () => {
    const breaker = new StubBreaker();
    const bomb = makeThrowingScraper();
    const ok = makeOverridingScraper(POLICY_TIGHT);
    const registry = buildRegistry([
      { site: Site.LINKEDIN, scraper: bomb },
      { site: Site.INDEED, scraper: ok },
    ]);

    const boot = new PluginPolicyBootstrapper(registry, breaker);
    const overridden = boot.applyPluginPolicies();

    // Throwing plugin is dropped (default policy retained); the next
    // plugin's override still lands.
    expect(overridden).toEqual([Site.INDEED]);
    expect(breaker.setPolicy).toHaveBeenCalledTimes(1);
    expect(breaker.setPolicy).toHaveBeenCalledWith(Site.INDEED, POLICY_TIGHT);
  });

  it('is a no-op when the breaker is unbound', () => {
    const registry = buildRegistry([
      { site: Site.LINKEDIN, scraper: makeOverridingScraper(POLICY_TIGHT) },
    ]);
    const boot = new PluginPolicyBootstrapper(registry, undefined);

    expect(boot.applyPluginPolicies()).toEqual([]);
  });

  it('is a no-op when the registry is unbound', () => {
    const breaker = new StubBreaker();
    const boot = new PluginPolicyBootstrapper(undefined, breaker);

    expect(boot.applyPluginPolicies()).toEqual([]);
    expect(breaker.setPolicy).not.toHaveBeenCalled();
  });

  it('onApplicationBootstrap delegates to applyPluginPolicies', () => {
    const breaker = new StubBreaker();
    const registry = buildRegistry([
      { site: Site.LINKEDIN, scraper: makeOverridingScraper(POLICY_TIGHT) },
    ]);
    const boot = new PluginPolicyBootstrapper(registry, breaker);
    const spy = jest.spyOn(boot, 'applyPluginPolicies');

    boot.onApplicationBootstrap();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(breaker.setPolicy).toHaveBeenCalledWith(Site.LINKEDIN, POLICY_TIGHT);
  });

  it('hot-swap re-trigger picks up a plugin registered after first pass', () => {
    const breaker = new StubBreaker();
    const registry = new PluginRegistry();
    const boot = new PluginPolicyBootstrapper(registry, breaker);

    // First pass — empty registry → no overrides.
    expect(boot.applyPluginPolicies()).toEqual([]);

    // Late registration (mirrors `registerExternal` for community plugins).
    registry.register(
      { site: Site.GLASSDOOR, name: 'gd-fake', category: 'job-board', isAts: false },
      makeOverridingScraper(POLICY_LAX),
    );

    // Re-trigger — bootstrapper now sees the late-bound plugin.
    expect(boot.applyPluginPolicies()).toEqual([Site.GLASSDOOR]);
    expect(breaker.setPolicy).toHaveBeenCalledTimes(1);
    expect(breaker.setPolicy).toHaveBeenCalledWith(Site.GLASSDOOR, POLICY_LAX);
  });
});
