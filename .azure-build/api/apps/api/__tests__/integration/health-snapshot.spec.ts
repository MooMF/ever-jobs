/**
 * Integration test — Spec 005 / T09 / FR-8.
 *
 * Wires the **real** `CircuitBreakerService`, the **real**
 * `InMemoryJobStore` (which now satisfies `IHealthSnapshotStore` per
 * T09 / Phase 5), and the **real** `HealthSnapshotCron` together — no
 * stubs — and verifies that:
 *
 *   1. After a few `breaker.exec(...)` calls (creating per-site
 *      breaker entries with non-trivial state), `cron.snapshot()`
 *      writes one `SourceHealth` row per site to the in-memory store.
 *      `store.snapshotSize` reflects the row count.
 *   2. `store.listSince(t0)` returns the rows in ascending insertion
 *      order; the per-row `SourceHealth.state` matches the breaker's
 *      live `state(site)` at the moment of capture.
 *   3. `store.latest(site)` returns the just-persisted row for known
 *      sites, and `null` for sites the breaker has never seen.
 *   4. Empty `breaker.list()` short-circuits — no rows written.
 *   5. The cron is a no-op when constructed without a snapshot store
 *      (the bypass path Spec 005 / FR-8 specifies for production
 *      backends that haven't opted in).
 *   6. Repeated cron ticks accumulate snapshot history — each tick is
 *      append-only (the contract MUSTs no collapse-by-(site, ts)).
 *
 * "Real" here means: real `CircuitBreakerService` honouring its
 * documented state machine, and real `InMemoryJobStore` honouring its
 * documented append-and-trim ring. The cron is the unit under test;
 * we exercise it through `cron.snapshot()` directly (no setInterval)
 * so the test is deterministic.
 */
import 'reflect-metadata';
import {
  ERR_SOURCE_CIRCUIT_OPEN,
  Site,
} from '@ever-jobs/models';
import { CircuitBreakerService } from '@ever-jobs/plugin';
import { InMemoryJobStore } from '@ever-jobs/store-memory';
import { HealthSnapshotCron } from '../../src/jobs/health-snapshot.cron';

describe('Integration — HealthSnapshotCron × CircuitBreakerService × InMemoryJobStore (Spec 005 / T09)', () => {
  it('persists one SourceHealth row per breaker site on each tick', async () => {
    const breaker = new CircuitBreakerService();
    const store = new InMemoryJobStore();
    const cron = new HealthSnapshotCron(breaker, store, 60_000);

    // Touch three sites with mixed outcomes so the breaker's per-site
    // entries have non-trivial state.
    await breaker.exec(Site.LINKEDIN, async () => 'ok');
    await expect(
      breaker.exec(Site.INDEED, async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    await breaker.exec(Site.GLASSDOOR, async () => 'ok');

    // Capture the moment BEFORE the snapshot so listSince(t0) returns
    // every row inserted in this test.
    const t0 = new Date(Date.now() - 1);
    const result = await cron.snapshot();

    expect(result).toEqual({ persisted: true, inserted: 3 });
    expect(store.snapshotSize).toBe(3);

    const rows = await store.listSince(t0);
    expect(rows).toHaveLength(3);

    // Each row's site/state pair matches the breaker's live state.
    const rowBySite = new Map(rows.map((r) => [r.health.site, r.health]));
    expect(rowBySite.get(Site.LINKEDIN)?.state).toBe(breaker.state(Site.LINKEDIN));
    expect(rowBySite.get(Site.INDEED)?.state).toBe(breaker.state(Site.INDEED));
    expect(rowBySite.get(Site.GLASSDOOR)?.state).toBe(breaker.state(Site.GLASSDOOR));
  });

  it('store.latest(site) returns the most recent SourceHealth, null for unknown sites', async () => {
    const breaker = new CircuitBreakerService();
    const store = new InMemoryJobStore();
    const cron = new HealthSnapshotCron(breaker, store, 60_000);

    await breaker.exec(Site.LINKEDIN, async () => 'ok');
    await cron.snapshot();

    const latest = await store.latest(Site.LINKEDIN);
    expect(latest).not.toBeNull();
    expect(latest!.site).toBe(Site.LINKEDIN);
    expect(latest!.state).toBe('closed');

    // INDEED was never touched — neither the breaker nor the cron
    // produces a row for it.
    expect(await store.latest(Site.INDEED)).toBeNull();
  });

  it('short-circuits putBatch when breaker has no entries', async () => {
    const breaker = new CircuitBreakerService();
    const store = new InMemoryJobStore();
    const cron = new HealthSnapshotCron(breaker, store, 60_000);

    const result = await cron.snapshot();

    expect(result).toEqual({ persisted: true, inserted: 0 });
    expect(store.snapshotSize).toBe(0);
  });

  it('is a no-op when no snapshot store is bound (Spec 005 / FR-8 bypass)', async () => {
    const breaker = new CircuitBreakerService();
    await breaker.exec(Site.LINKEDIN, async () => 'ok');

    // Production scenario: operator picked a backend that doesn't
    // satisfy IHealthSnapshotStore — StoreModule.forActive binds the
    // snapshot token to `null` and the cron's @Optional() consumer
    // sees the sentinel.
    const cron = new HealthSnapshotCron(breaker, null, 60_000);
    const result = await cron.snapshot();

    expect(result).toEqual({ persisted: false, reason: 'no-binding' });
  });

  it('is a no-op when no breaker is bound (defensive)', async () => {
    const store = new InMemoryJobStore();
    const cron = new HealthSnapshotCron(undefined, store, 60_000);

    const result = await cron.snapshot();

    expect(result).toEqual({ persisted: false, reason: 'no-binding' });
    expect(store.snapshotSize).toBe(0);
  });

  it('repeated ticks append rows (no collapse-by-(site, ts))', async () => {
    const breaker = new CircuitBreakerService();
    const store = new InMemoryJobStore();
    const cron = new HealthSnapshotCron(breaker, store, 60_000);

    await breaker.exec(Site.LINKEDIN, async () => 'ok');

    // Three ticks → three rows for LinkedIn (the breaker's only entry).
    // The contract's "append-only" wording is exactly this: rows MUST
    // accumulate even when the captured payload is identical.
    await cron.snapshot();
    await cron.snapshot();
    await cron.snapshot();

    expect(store.snapshotSize).toBe(3);
    const linkedinRows = await store.listSince(new Date(0), {
      site: Site.LINKEDIN,
    });
    expect(linkedinRows).toHaveLength(3);
  });

  it('captures circuit-open state once the breaker has opened', async () => {
    const breaker = new CircuitBreakerService();
    const store = new InMemoryJobStore();
    const cron = new HealthSnapshotCron(breaker, store, 60_000);

    // Drive LinkedIn into `open` state by exhausting the default
    // 5-failure threshold.
    for (let i = 0; i < 5; i++) {
      await expect(
        breaker.exec(Site.LINKEDIN, async () => {
          throw new Error('boom');
        }),
      ).rejects.toThrow('boom');
    }
    // 6th call short-circuits with ERR_SOURCE_CIRCUIT_OPEN.
    await expect(
      breaker.exec(Site.LINKEDIN, async () => 'unreachable'),
    ).rejects.toMatchObject({ code: ERR_SOURCE_CIRCUIT_OPEN });

    await cron.snapshot();
    const latest = await store.latest(Site.LINKEDIN);
    expect(latest?.state).toBe('open');
  });
});
