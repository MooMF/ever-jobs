/**
 * Integration test — Spec 005 / T08.
 *
 * Wires the **real** `PluginRegistry`, the **real** `CircuitBreakerService`,
 * and the **real** `PluginPolicyBootstrapper` together (no Nest bootstrap)
 * and verifies that:
 *
 *   1. After `onApplicationBootstrap()`, a plugin's overridden policy
 *      actually changes the breaker's behaviour for that `Site` — i.e. the
 *      real `setPolicy` path lands the override.
 *   2. Sites without an override keep the default 5-failure threshold.
 *   3. The override only affects the overriding `Site` (per-site
 *      isolation invariant).
 *
 * The "behavioural" check (open after 2 failures instead of 5) is the
 * acceptance from `tasks.md` — "Plugin-defined policy wins over default at
 * registration." We exercise the full breaker state machine rather than
 * inspecting policy fields directly, so a future refactor that bypasses
 * `setPolicy` will still surface as a test failure.
 */
import 'reflect-metadata';
import {
  CircuitPolicy,
  ICircuitBreakerPolicyProvider,
  IScraper,
  JobResponseDto,
  ScraperInputDto,
  Site,
} from '@ever-jobs/models';
import {
  CircuitBreakerService,
  PluginRegistry,
} from '@ever-jobs/plugin';
import { PluginPolicyBootstrapper } from '../../src/jobs/plugin-policy.bootstrapper';

const TIGHT_POLICY: CircuitPolicy = {
  failureThreshold: 2,
  cooldownMs: 60_000,
  halfOpenProbes: 1,
  rollingWindowMs: 60_000,
};

function makeFailingScraper(
  overridePolicy?: CircuitPolicy,
): IScraper & Partial<ICircuitBreakerPolicyProvider> {
  const base: IScraper = {
    scrape: jest.fn(async (_input: ScraperInputDto): Promise<JobResponseDto> => {
      throw new Error('Simulated source failure');
    }),
  };
  if (overridePolicy) {
    return { ...base, getCircuitBreakerPolicy: () => overridePolicy };
  }
  return base;
}

describe('Integration — PluginPolicyBootstrapper × CircuitBreakerService (Spec 005 / T08)', () => {
  it('overridden plugin opens after 2 failures (TIGHT_POLICY) instead of 5 (default)', async () => {
    const breaker = new CircuitBreakerService();
    const registry = new PluginRegistry();

    // LinkedIn — overrides to a 2-failure threshold.
    const liScraper = makeFailingScraper(TIGHT_POLICY);
    registry.register(
      { site: Site.LINKEDIN, name: 'li-fake', category: 'job-board', isAts: false },
      liScraper,
    );

    // Indeed — keeps default 5-failure threshold.
    const inScraper = makeFailingScraper();
    registry.register(
      { site: Site.INDEED, name: 'in-fake', category: 'job-board', isAts: false },
      inScraper,
    );

    const boot = new PluginPolicyBootstrapper(registry, breaker);
    boot.onApplicationBootstrap();

    // LinkedIn — 2 failures should be enough.
    for (let i = 0; i < 2; i++) {
      await expect(
        breaker.exec(Site.LINKEDIN, () => liScraper.scrape({} as ScraperInputDto)),
      ).rejects.toThrow();
    }
    expect(breaker.state(Site.LINKEDIN)).toBe('open');

    // Indeed — 2 failures should NOT be enough (still closed under the default).
    for (let i = 0; i < 2; i++) {
      await expect(
        breaker.exec(Site.INDEED, () => inScraper.scrape({} as ScraperInputDto)),
      ).rejects.toThrow();
    }
    expect(breaker.state(Site.INDEED)).toBe('closed');

    // 3 more Indeed failures → reaches the default 5-threshold and opens.
    for (let i = 0; i < 3; i++) {
      await expect(
        breaker.exec(Site.INDEED, () => inScraper.scrape({} as ScraperInputDto)),
      ).rejects.toThrow();
    }
    expect(breaker.state(Site.INDEED)).toBe('open');
  });

  it('returns the list of sites whose policy was actually overridden', () => {
    const breaker = new CircuitBreakerService();
    const registry = new PluginRegistry();

    registry.register(
      { site: Site.LINKEDIN, name: 'li', category: 'job-board', isAts: false },
      makeFailingScraper(TIGHT_POLICY),
    );
    registry.register(
      { site: Site.INDEED, name: 'in', category: 'job-board', isAts: false },
      makeFailingScraper(),
    );

    const boot = new PluginPolicyBootstrapper(registry, breaker);
    const overridden = boot.applyPluginPolicies();

    expect(overridden).toEqual([Site.LINKEDIN]);
  });

  it('runtime-registered plugin only takes effect after a re-trigger', () => {
    const breaker = new CircuitBreakerService();
    const registry = new PluginRegistry();

    const boot = new PluginPolicyBootstrapper(registry, breaker);
    expect(boot.applyPluginPolicies()).toEqual([]);

    // Late-bind a community plugin via PluginRegistry.registerExternal.
    const lateScraper = makeFailingScraper(TIGHT_POLICY);
    registry.register(
      { site: Site.GLASSDOOR, name: 'gd-late', category: 'niche', isAts: false },
      lateScraper,
    );

    // Without re-trigger the policy is still default — Glassdoor needs 5
    // failures to open.
    expect(breaker.state(Site.GLASSDOOR)).toBe('closed');

    // Re-trigger picks the late plugin up.
    expect(boot.applyPluginPolicies()).toEqual([Site.GLASSDOOR]);
  });
});
