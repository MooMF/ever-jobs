/**
 * Integration test — Spec 005 / T04
 *
 * Acceptance from `tasks.md`:
 *   "1-of-3 always-fail fake plugins → aggregator returns 2 results."
 *
 * The test wires the **real** {@link CircuitBreakerService} +
 * {@link CircuitBreakerInterceptor} into a {@link JobsService} populated
 * with three fake scrapers (two healthy, one always-failing). It then
 * exercises {@link JobsAggregator.aggregate} end-to-end and verifies:
 *
 *   1. The first call surfaces 2 results (the two healthy sources) — the
 *      failing source rejects but `Promise.allSettled` swallows it; the
 *      breaker is still `closed` because it has only seen one failure.
 *   2. After enough consecutive failures (the default policy's
 *      `failureThreshold` = 5) the bad source's breaker opens.
 *   3. The next call short-circuits the bad source via the interceptor —
 *      `scrape()` is **not** invoked at all — and still returns 2 results
 *      (the healthy sources). This is the FR-1 / FR-4 contract.
 *   4. `forceOpen` on a healthy source makes the aggregator drop that
 *      source's results too, isolated by `Site` (FR-7 + per-site
 *      isolation invariant).
 *
 * The test does NOT bootstrap NestJS — that would pull in 200+ source
 * modules and a Postgres connection. We construct the wiring by hand to
 * keep the run sub-second, but every component under test
 * (`CircuitBreakerService`, `CircuitBreakerInterceptor`, `JobsService`,
 * `JobsAggregator`, `PluginRegistry`) is the real production class.
 */
import 'reflect-metadata';
import {
  IScraper,
  JobPostDto,
  JobResponseDto,
  ScraperInputDto,
  Site,
} from '@ever-jobs/models';
import {
  CircuitBreakerInterceptor,
  CircuitBreakerService,
  PluginRegistry,
} from '@ever-jobs/plugin';
import { JobsAggregator } from '../../src/jobs/jobs.aggregator';
import { JobsService } from '../../src/jobs/jobs.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeHealthyScraper(site: Site, jobId: string): IScraper {
  return {
    scrape: jest.fn().mockResolvedValue(
      new JobResponseDto([
        new JobPostDto({
          id: jobId,
          title: `${site} job`,
          companyName: 'Acme Corp',
          jobUrl: `https://example.com/${site}/${jobId}`,
          isRemote: false,
        }),
      ]),
    ),
  };
}

function makeFailingScraper(reason = 'Simulated source failure'): IScraper {
  return {
    scrape: jest.fn().mockRejectedValue(new Error(reason)),
  };
}

/**
 * Stand up the production wiring (registry → service → aggregator) plus
 * a real circuit-breaker interceptor. Returns the handles needed to
 * drive the scenarios.
 */
function bootstrap(scrapers: Array<{ site: Site; isAts: boolean; scraper: IScraper }>) {
  const registry = new PluginRegistry();
  for (const { site, isAts, scraper } of scrapers) {
    registry.register(
      { site, name: `${site}-fake`, category: isAts ? 'ats' : 'job-board', isAts },
      scraper,
    );
  }

  const breaker = new CircuitBreakerService();
  const interceptor = new CircuitBreakerInterceptor(undefined, breaker);

  // Stub ConfigService — JobsService only reads `.get('retry')`.
  const configService = {
    get: (key: string) => {
      if (key === 'retry') {
        return {
          defaultRetries: 0,
          defaultDelayMs: 0,
          defaultBackoff: 'linear',
          perSource: {},
        };
      }
      return undefined;
    },
  } as any;

  // Stub MetricsService — JobsService only touches the two collectors.
  const noopTimer = () => 0;
  const metrics = {
    scraperRequestsTotal: { inc: jest.fn() },
    scraperDuration: { startTimer: jest.fn(() => noopTimer) },
  } as any;

  const jobsService = new JobsService(registry, configService, metrics, interceptor);
  const aggregator = new JobsAggregator(jobsService);

  return { registry, breaker, interceptor, jobsService, aggregator };
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

describe('Integration — JobsAggregator + CircuitBreaker (Spec 005 / T04)', () => {
  const goodA = makeHealthyScraper(Site.LINKEDIN, 'a1');
  const goodB = makeHealthyScraper(Site.INDEED, 'b1');
  const bad = makeFailingScraper();

  const baseInput = new ScraperInputDto({
    searchTerm: 'engineer',
    siteType: [Site.LINKEDIN, Site.INDEED, Site.GLASSDOOR],
  });

  it('returns 2 results from the start when 1-of-3 always fails (closed breaker)', async () => {
    const { aggregator } = bootstrap([
      { site: Site.LINKEDIN, isAts: false, scraper: goodA },
      { site: Site.INDEED, isAts: false, scraper: goodB },
      { site: Site.GLASSDOOR, isAts: false, scraper: bad },
    ]);

    const out = await aggregator.aggregate(baseInput, { dedup: false });

    // Bad source rejected; Promise.allSettled swallowed the rejection.
    expect(out.outputCount).toBe(2);
    expect(out.jobs.map((j) => j.site).sort()).toEqual([Site.INDEED, Site.LINKEDIN]);
    expect((bad.scrape as jest.Mock).mock.calls.length).toBe(1);
  });

  it('opens the bad source after 5 consecutive failures and short-circuits subsequent fan-outs', async () => {
    const localGoodA = makeHealthyScraper(Site.LINKEDIN, 'a1');
    const localGoodB = makeHealthyScraper(Site.INDEED, 'b1');
    const localBad = makeFailingScraper();

    const { aggregator, breaker } = bootstrap([
      { site: Site.LINKEDIN, isAts: false, scraper: localGoodA },
      { site: Site.INDEED, isAts: false, scraper: localGoodB },
      { site: Site.GLASSDOOR, isAts: false, scraper: localBad },
    ]);

    // 5 fan-outs → bad source's breaker should open after the 5th failure.
    for (let i = 0; i < 5; i++) {
      const out = await aggregator.aggregate(baseInput, { dedup: false });
      expect(out.outputCount).toBe(2);
    }
    expect(breaker.state(Site.GLASSDOOR)).toBe('open');
    expect((localBad.scrape as jest.Mock).mock.calls.length).toBe(5);

    // 6th fan-out: bad source should be short-circuited — scrape() not invoked.
    const final = await aggregator.aggregate(baseInput, { dedup: false });
    expect(final.outputCount).toBe(2);
    expect(final.jobs.map((j) => j.site).sort()).toEqual([
      Site.INDEED,
      Site.LINKEDIN,
    ]);
    // Critically: the bad scraper was NOT invoked on the 6th call.
    expect((localBad.scrape as jest.Mock).mock.calls.length).toBe(5);
    // Healthy sources continued (5 prior + this 6th).
    expect((localGoodA.scrape as jest.Mock).mock.calls.length).toBe(6);
    expect((localGoodB.scrape as jest.Mock).mock.calls.length).toBe(6);
  });

  it('forceOpen on a healthy source isolates that source only', async () => {
    const localGoodA = makeHealthyScraper(Site.LINKEDIN, 'a1');
    const localGoodB = makeHealthyScraper(Site.INDEED, 'b1');

    const { aggregator, breaker } = bootstrap([
      { site: Site.LINKEDIN, isAts: false, scraper: localGoodA },
      { site: Site.INDEED, isAts: false, scraper: localGoodB },
    ]);

    breaker.forceOpen(Site.LINKEDIN);

    const out = await aggregator.aggregate(
      new ScraperInputDto({
        searchTerm: 'engineer',
        siteType: [Site.LINKEDIN, Site.INDEED],
      }),
      { dedup: false },
    );

    expect(out.outputCount).toBe(1);
    expect(out.jobs[0].site).toBe(Site.INDEED);
    expect((localGoodA.scrape as jest.Mock).mock.calls.length).toBe(0);
    expect((localGoodB.scrape as jest.Mock).mock.calls.length).toBe(1);
  });

  it('breaker is a no-op when the interceptor is not bound (back-compat)', async () => {
    // Reproduce the prior wiring (no interceptor) by constructing
    // JobsService without the optional 4th param.
    const registry = new PluginRegistry();
    registry.register(
      { site: Site.LINKEDIN, name: 'li-fake', category: 'job-board', isAts: false },
      makeHealthyScraper(Site.LINKEDIN, 'a1'),
    );
    registry.register(
      { site: Site.INDEED, name: 'in-fake', category: 'job-board', isAts: false },
      makeFailingScraper(),
    );

    const noopTimer = () => 0;
    const metrics = {
      scraperRequestsTotal: { inc: jest.fn() },
      scraperDuration: { startTimer: jest.fn(() => noopTimer) },
    } as any;
    const configService = {
      get: () => ({
        defaultRetries: 0,
        defaultDelayMs: 0,
        defaultBackoff: 'linear',
        perSource: {},
      }),
    } as any;

    const service = new JobsService(registry, configService, metrics);
    const aggregator = new JobsAggregator(service);

    const out = await aggregator.aggregate(
      new ScraperInputDto({
        searchTerm: 'engineer',
        siteType: [Site.LINKEDIN, Site.INDEED],
      }),
      { dedup: false },
    );

    // Bad source still rejects via Promise.allSettled — but no breaker
    // engaged. Aggregator returns the LinkedIn job only.
    expect(out.outputCount).toBe(1);
    expect(out.jobs[0].site).toBe(Site.LINKEDIN);
  });
});
