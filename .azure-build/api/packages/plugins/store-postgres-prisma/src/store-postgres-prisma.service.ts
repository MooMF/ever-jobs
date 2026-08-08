import { Inject, Injectable, Optional } from '@nestjs/common';
import {
  CanonicalJob,
  ERR_STORE_INVALID_CURSOR,
  IJobObservationStore,
  IJobStore,
  JOB_STORE_QUERY_DEFAULT_LIMIT,
  JOB_STORE_QUERY_MAX_LIMIT,
  JobStorePage,
  JobStoreQuery,
  Site,
  SourceObservation,
} from '@ever-jobs/models';
import { StorePlugin } from '@ever-jobs/plugin';

/**
 * Canonical id under which this backend registers with `StoreRegistry`.
 * Operators select it via `EVER_JOBS_STORE=postgres`.
 */
export const STORE_POSTGRES_PRISMA_ID = 'postgres';

/**
 * One-line description shown by `GET /api/storage` and the CLI's
 * `stores list` subcommand for operator triage.
 */
export const STORE_POSTGRES_PRISMA_DESCRIPTION =
  'Postgres production store via Prisma + pg_trgm GIN indexes (Spec 004 — prod-default)';

/**
 * Cursor envelope for Postgres keyset pagination.
 *
 * Encoded as base64-of-JSON over `{ v, mergedAt, canonicalJobId }`. The
 * envelope is wire-compatible with the SQLite backend's cursor (T08) so
 * the future `GET /api/jobs?cursor=…` endpoint does NOT fork on backend
 * type — operators can swap `EVER_JOBS_STORE=sqlite` ↔ `=postgres` and
 * outstanding cursors still parse. The `v: 1` discriminator is forward-
 * compatibility insurance: a future v2 envelope (e.g. SAFE-pointer for a
 * sharded backend) ships `v: 2` and rejects v1 cursors with
 * `ERR_STORE_INVALID_CURSOR` rather than silently misinterpreting them.
 *
 * The cursor literally encodes the last-yielded row's ordering tuple so
 * page N+1 resumes via `(merged_at < cursor.mergedAt) OR (merged_at =
 * cursor.mergedAt AND canonical_job_id > cursor.canonicalJobId)` — note
 * the asymmetry, `<` for the DESC column and `>` for the ASC tie-break.
 * This predicate is index-friendly: the planner picks
 * `idx_canonical_job_merged_at_id` for an index seek of O(log N) rather
 * than the seq scan + sort an OFFSET-based pager would force.
 */
interface PostgresCursor {
  readonly v: 1;
  readonly mergedAt: string;
  readonly canonicalJobId: string;
}

const POSTGRES_CURSOR_VERSION = 1;

/**
 * Error type thrown for malformed pagination cursors. Carries the
 * Spec 004 §7.3 wire code so callers and the conformance suite can
 * `expect(...).toMatchObject({ code: ERR_STORE_INVALID_CURSOR })`
 * without coupling to a specific class.
 */
class PostgresStoreCursorError extends Error {
  readonly code: string = ERR_STORE_INVALID_CURSOR;

  constructor(detail: string) {
    super(`Malformed JobStoreQuery cursor (${detail})`);
    this.name = 'PostgresStoreCursorError';
  }
}

function encodeCursor(cursor: PostgresCursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64');
}

/**
 * Decode and validate the opaque cursor. Surface `ERR_STORE_INVALID_CURSOR`
 * for every reject path: not-base64, not-json, missing fields, wrong
 * version, non-string components. Silent fallback to "page 1" is the
 * failure mode this code path was created to prevent — a cursor-format
 * drift would silently desync paginating callers.
 */
function decodeCursor(raw: string): PostgresCursor {
  let decoded: string;
  try {
    decoded = Buffer.from(raw, 'base64').toString('utf8');
  } catch {
    throw new PostgresStoreCursorError('not base64');
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(decoded);
  } catch {
    throw new PostgresStoreCursorError('not JSON');
  }
  if (typeof parsed !== 'object' || parsed === null) {
    throw new PostgresStoreCursorError('not an object');
  }
  const obj = parsed as Record<string, unknown>;
  if (obj.v !== POSTGRES_CURSOR_VERSION) {
    throw new PostgresStoreCursorError(`unsupported version ${String(obj.v)}`);
  }
  if (typeof obj.mergedAt !== 'string' || obj.mergedAt.length === 0) {
    throw new PostgresStoreCursorError('mergedAt is not a non-empty string');
  }
  if (typeof obj.canonicalJobId !== 'string' || obj.canonicalJobId.length === 0) {
    throw new PostgresStoreCursorError('canonicalJobId is not a non-empty string');
  }
  return {
    v: POSTGRES_CURSOR_VERSION,
    mergedAt: obj.mergedAt,
    canonicalJobId: obj.canonicalJobId,
  };
}

/**
 * Resolve the effective `limit` for a query. Mirrors the in-memory and
 * sqlite-drizzle backends: default to {@link JOB_STORE_QUERY_DEFAULT_LIMIT}
 * when omitted / non-finite / non-positive; clamp to
 * {@link JOB_STORE_QUERY_MAX_LIMIT}. Behaviour MUST match across backends
 * so the conformance suite's limit cases pass uniformly.
 */
function resolveLimit(limit: number | undefined): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit) || limit <= 0) {
    return JOB_STORE_QUERY_DEFAULT_LIMIT;
  }
  return Math.min(Math.floor(limit), JOB_STORE_QUERY_MAX_LIMIT);
}

// =====================================================================
// Structural Prisma client surface
// =====================================================================

/**
 * Row shape persisted to the `canonical_job` table. Mirrors the
 * Prisma-generated `CanonicalJob` model. Declared structurally here so
 * this package's TS surface does NOT depend on a successful
 * `prisma generate` — the typed client is a code-gen artefact (it lives
 * under `node_modules/.prisma/client` after `prisma generate` runs)
 * which the scheduled-task sandbox cannot produce. CI runs
 * `prisma generate` before tests, and the real generated client
 * structurally satisfies this interface.
 */
interface PrismaCanonicalJobRow {
  canonicalJobId: string;
  title: string;
  company: string;
  location: string;
  description: string | null;
  url: string;
  mergedAt: Date;
  fields: unknown;
  sources: unknown;
}

/** Row shape persisted to the `source_observation` table. */
interface PrismaSourceObservationRow {
  canonicalJobId: string;
  site: string;
  sourceJobId: string;
  url: string;
  observedAt: Date;
  rawTitle: string | null;
}

/**
 * Narrowed Prisma client surface this store relies on. The real
 * `PrismaClient` produced by `prisma generate` against
 * `prisma/schema.prisma` structurally satisfies this — the fields
 * `canonicalJob` / `sourceObservation` and methods `upsert / findUnique /
 * findMany / delete / deleteMany / createMany / count` are all standard
 * Prisma model-delegate API.
 *
 * Why a structural interface instead of `import type { PrismaClient }
 * from '@prisma/client'`?
 *
 *   1. The typed client is a code-gen artefact. Without `prisma generate`
 *      it does not exist; ts-jest in the scheduled-task sandbox would
 *      fail to type-check this file. The structural interface compiles
 *      regardless.
 *   2. It pins the contract this store actually uses. If a future Prisma
 *      major version renames a delegate method, the failure surfaces
 *      here, not at every call-site.
 *   3. It lets test fakes and mocks satisfy the contract trivially.
 */
export interface PrismaJobsClient {
  canonicalJob: {
    upsert(args: {
      where: { canonicalJobId: string };
      create: PrismaCanonicalJobRow;
      update: Partial<Omit<PrismaCanonicalJobRow, 'canonicalJobId'>>;
    }): Promise<PrismaCanonicalJobRow>;

    findUnique(args: {
      where: { canonicalJobId: string };
    }): Promise<PrismaCanonicalJobRow | null>;

    findMany(args: {
      where?: Record<string, unknown>;
      orderBy?: ReadonlyArray<Record<string, 'asc' | 'desc'>>;
      take?: number;
    }): Promise<PrismaCanonicalJobRow[]>;

    delete(args: {
      where: { canonicalJobId: string };
    }): Promise<PrismaCanonicalJobRow>;

    count(args?: { where?: Record<string, unknown> }): Promise<number>;
  };

  sourceObservation: {
    createMany(args: {
      data: ReadonlyArray<PrismaSourceObservationRow>;
    }): Promise<{ count: number }>;

    findMany(args: {
      where?: Record<string, unknown>;
    }): Promise<PrismaSourceObservationRow[]>;

    deleteMany(args: {
      where?: Record<string, unknown>;
    }): Promise<{ count: number }>;
  };

  /**
   * Callback-form transaction. Prisma's `$transaction(fn)` runs `fn`
   * inside a single Postgres transaction and rolls back on throw.
   */
  $transaction<T>(fn: (tx: PrismaJobsClient) => Promise<T>): Promise<T>;

  /**
   * Release the underlying connection pool. Tests SHOULD await this in
   * `afterAll` to avoid Jest's "open handle" leak warning.
   */
  $disconnect(): Promise<void>;
}

// =====================================================================
// Configuration + DI tokens
// =====================================================================

/**
 * Configuration for the Postgres backend. The consumer constructs the
 * `PrismaClient` (or a structural fake) and passes it via this config —
 * the store itself does NOT construct or own the client, so its runtime
 * imports stay free of `@prisma/client`.
 *
 * Production wiring (`apps/api`):
 *
 * ```typescript
 * import { PrismaClient } from '@prisma/client';
 *
 * const prisma = new PrismaClient({
 *   datasourceUrl: process.env.DATABASE_URL,
 * });
 *
 * StoreModule.forActive(process.env.EVER_JOBS_STORE ?? 'postgres', {
 *   backends: [PostgresPrismaJobStore],
 *   providers: [
 *     {
 *       provide: STORE_POSTGRES_PRISMA_CONFIG,
 *       useValue: { client: prisma },
 *     },
 *   ],
 * });
 * ```
 */
export interface StorePostgresPrismaConfig {
  /**
   * Pre-constructed Prisma client. The store does NOT manage the
   * lifecycle of this object — operator-owned wiring is responsible for
   * calling `prisma.$disconnect()` at process-shutdown.
   */
  readonly client: PrismaJobsClient;
}

/**
 * NestJS DI token for {@link StorePostgresPrismaConfig}. Bind it via a
 * provider in the consuming app's root module so the Prisma client is
 * resolved from `DATABASE_URL` at bootstrap. The token is `@Optional()`
 * on the constructor — when absent, the constructor throws a
 * configuration error fail-fast so a misconfigured deployment cannot
 * silently fall back to a no-op or another backend.
 */
export const STORE_POSTGRES_PRISMA_CONFIG = 'STORE_POSTGRES_PRISMA_CONFIG';

// =====================================================================
// Service
// =====================================================================

/**
 * Postgres-backed reference implementation of `IJobStore` +
 * `IJobObservationStore` (Spec 004 / Phase 4 / T10).
 *
 * Design choices:
 *
 *   1. **Asynchronous Prisma driver.** Postgres is over-the-wire — every
 *      query is genuinely async. The IJobStore methods stay async to
 *      match the contract; no fake-async wrappers needed.
 *
 *   2. **Structural Prisma client surface ({@link PrismaJobsClient}).**
 *      The store does NOT import `@prisma/client` at runtime; it
 *      receives a pre-constructed client via DI and types it
 *      structurally. Keeps this package compileable in environments
 *      that haven't run `prisma generate` yet (the scheduled-task
 *      sandbox) without weakening the API surface in environments
 *      that have.
 *
 *   3. **Keyset cursor pagination.** Spec 004 / NFR-1 budgets <50 ms
 *      p95 read on Postgres. Offset paging fails this at scale (every
 *      page walks the skipped prefix); keyset paging stays O(log N) by
 *      seeking on the composite `(merged_at DESC, canonical_job_id ASC)`
 *      index from `0_init/migration.sql`. See
 *      {@link buildCursorWherePredicate}.
 *
 *   4. **`pg_trgm` GIN indexes for `ILIKE`.** The migration creates
 *      `idx_canonical_job_company_trgm` / `_title_trgm` / `_location_trgm`
 *      with the `gin_trgm_ops` opclass. Prisma's `{ company: { contains:
 *      'foo', mode: 'insensitive' } }` compiles to `company ILIKE
 *      '%foo%'`, which the planner can satisfy via a GIN index seek
 *      (vs the seq scan it would otherwise fall back to).
 *
 *   5. **`jsonb` for `fields` / `sources`.** Stored as Postgres `jsonb`
 *      (binary representation, GIN-indexable, faster reads) per the
 *      schema decision in T09. The store round-trips through Prisma's
 *      `Json` type, which accepts arbitrary JSON-serialisable values
 *      and returns the same shape on read.
 *
 *   6. **FK CASCADE owned by Postgres.** The `source_observation.
 *      canonical_job_id` FK with `ON DELETE CASCADE` means a single
 *      `prisma.canonicalJob.delete` drops every attached observation
 *      atomically. Postgres enforces FKs unconditionally; no PRAGMA
 *      toggle (unlike SQLite).
 *
 *   7. **Eager-fail constructor.** When the consumer forgets to bind
 *      `STORE_POSTGRES_PRISMA_CONFIG`, the constructor throws at
 *      bootstrap. Spec 004 §7.3 / FR-3 explicitly says misconfigured
 *      deployments MUST fail fast — silent fallback to in-memory mode
 *      would let the prod cohort silently disappear.
 */
@StorePlugin({
  id: STORE_POSTGRES_PRISMA_ID,
  description: STORE_POSTGRES_PRISMA_DESCRIPTION,
})
@Injectable()
export class PostgresPrismaJobStore implements IJobStore, IJobObservationStore {
  private readonly client: PrismaJobsClient;

  constructor(
    @Optional()
    @Inject(STORE_POSTGRES_PRISMA_CONFIG)
    config?: StorePostgresPrismaConfig,
  ) {
    if (!config?.client) {
      // Spec 004 / §7.3 / FR-3: bootstrap MUST fail fast on a
      // misconfigured store rather than silently fall back to an empty
      // in-memory cohort. The error message names the missing token so
      // the operator can fix it without grepping the source tree.
      throw new Error(
        '[PostgresPrismaJobStore] requires a Prisma client. Bind ' +
          'STORE_POSTGRES_PRISMA_CONFIG with a `{ client: new PrismaClient(...) }` ' +
          'provider in apps/api root module before activating this backend ' +
          '(Spec 004 / §7.3 / FR-3).',
      );
    }
    this.client = config.client;
  }

  // ----------------------------------------------------------------------
  // IJobStore
  // ----------------------------------------------------------------------

  async upsert(job: CanonicalJob): Promise<CanonicalJob> {
    const row = toPrismaCanonicalJobRow(job);
    await this.client.canonicalJob.upsert({
      where: { canonicalJobId: row.canonicalJobId },
      create: row,
      update: {
        title: row.title,
        company: row.company,
        location: row.location,
        description: row.description,
        url: row.url,
        mergedAt: row.mergedAt,
        fields: row.fields,
        sources: row.sources,
      },
    });
    return job;
  }

  async upsertMany(
    jobs: ReadonlyArray<CanonicalJob>,
  ): Promise<{ inserted: number; updated: number }> {
    if (jobs.length === 0) {
      return { inserted: 0, updated: 0 };
    }
    // Single transaction — partial failure leaves no half-written cohort.
    // We pre-check existence in one query so inserted-vs-updated counts
    // come back without an extra round-trip per row.
    return this.client.$transaction(async (tx) => {
      const ids = jobs.map((j) => j.canonicalJobId);
      const existing = await tx.canonicalJob.findMany({
        where: { canonicalJobId: { in: ids } },
      });
      const existingSet = new Set(existing.map((e) => e.canonicalJobId));

      let inserted = 0;
      let updated = 0;
      for (const job of jobs) {
        const row = toPrismaCanonicalJobRow(job);
        await tx.canonicalJob.upsert({
          where: { canonicalJobId: row.canonicalJobId },
          create: row,
          update: {
            title: row.title,
            company: row.company,
            location: row.location,
            description: row.description,
            url: row.url,
            mergedAt: row.mergedAt,
            fields: row.fields,
            sources: row.sources,
          },
        });
        if (existingSet.has(job.canonicalJobId)) {
          updated++;
        } else {
          inserted++;
        }
      }
      return { inserted, updated };
    });
  }

  async getById(id: string): Promise<CanonicalJob | null> {
    const row = await this.client.canonicalJob.findUnique({
      where: { canonicalJobId: id },
    });
    if (row === null) return null;
    return fromPrismaCanonicalJobRow(row);
  }

  async findByCanonicalId(canonicalJobId: string): Promise<CanonicalJob | null> {
    return this.getById(canonicalJobId);
  }

  async listByQuery(query: JobStoreQuery): Promise<JobStorePage<CanonicalJob>> {
    const limit = resolveLimit(query.limit);
    const cursor =
      typeof query.cursor === 'string' ? decodeCursor(query.cursor) : undefined;

    const where = buildWhereClause(query, cursor);

    const rows = await this.client.canonicalJob.findMany({
      where,
      orderBy: [{ mergedAt: 'desc' }, { canonicalJobId: 'asc' }],
      take: limit,
    });

    const items = rows.map(fromPrismaCanonicalJobRow);

    if (items.length < limit) {
      // Last page — no cursor.
      return { items };
    }
    // Probe one extra row with a follow-up keyset query to know whether
    // there's MORE data after this page. Cheaper than `OFFSET` + a
    // duplicate scan; the index seek is O(log N).
    const last = items[items.length - 1];
    const probeCursor: PostgresCursor = {
      v: POSTGRES_CURSOR_VERSION,
      mergedAt: last.mergedAt,
      canonicalJobId: last.canonicalJobId,
    };
    const moreWhere = buildWhereClause(query, probeCursor);
    const more = await this.client.canonicalJob.findMany({
      where: moreWhere,
      orderBy: [{ mergedAt: 'desc' }, { canonicalJobId: 'asc' }],
      take: 1,
    });

    if (more.length === 0) {
      return { items };
    }
    return {
      items,
      nextCursor: encodeCursor(probeCursor),
    };
  }

  async delete(id: string): Promise<boolean> {
    // FK ON DELETE CASCADE drops attached observations automatically
    // (Postgres enforces FKs unconditionally — no PRAGMA toggle).
    // Prisma's `delete` throws when the row doesn't exist; we want
    // `false` instead, so check first via a count.
    const exists = await this.client.canonicalJob.count({
      where: { canonicalJobId: id },
    });
    if (exists === 0) return false;
    await this.client.canonicalJob.delete({ where: { canonicalJobId: id } });
    return true;
  }

  // ----------------------------------------------------------------------
  // IJobObservationStore
  // ----------------------------------------------------------------------

  async putAll(
    canonicalJobId: string,
    observations: ReadonlyArray<SourceObservation>,
  ): Promise<void> {
    // Replace-not-merge per FR-2: drop the existing set, then insert the
    // new one. Wrapped in a transaction so partial failure leaves the
    // prior set intact.
    await this.client.$transaction(async (tx) => {
      await tx.sourceObservation.deleteMany({
        where: { canonicalJobId },
      });
      if (observations.length === 0) return;
      const data: PrismaSourceObservationRow[] = observations.map((o) => ({
        canonicalJobId,
        site: String(o.site),
        sourceJobId: o.sourceJobId,
        url: o.url,
        observedAt: new Date(o.observedAt),
        rawTitle: o.rawTitle ?? null,
      }));
      await tx.sourceObservation.createMany({ data });
    });
  }

  async listByCanonicalId(
    canonicalJobId: string,
  ): Promise<ReadonlyArray<SourceObservation>> {
    const rows = await this.client.sourceObservation.findMany({
      where: { canonicalJobId },
    });
    return rows.map((r) => ({
      site: r.site as Site,
      sourceJobId: r.sourceJobId,
      url: r.url,
      observedAt: r.observedAt instanceof Date
        ? r.observedAt.toISOString()
        : String(r.observedAt),
      rawTitle: r.rawTitle ?? undefined,
    }));
  }

  async deleteByCanonicalId(canonicalJobId: string): Promise<number> {
    const result = await this.client.sourceObservation.deleteMany({
      where: { canonicalJobId },
    });
    return result.count;
  }

  // ----------------------------------------------------------------------
  // Test / debug surface (not part of either interface contract).
  // ----------------------------------------------------------------------

  /**
   * Total canonical rows currently stored. Test-only diagnostic.
   */
  async size(): Promise<number> {
    return this.client.canonicalJob.count();
  }
}

// =====================================================================
// Helpers
// =====================================================================

/**
 * Translate a `CanonicalJob` (interface contract — `mergedAt` is an
 * ISO-8601 string) to the Prisma row shape (`mergedAt` is a `Date`).
 * Postgres's `timestamptz` round-trips losslessly via Prisma's
 * `DateTime` mapping.
 */
function toPrismaCanonicalJobRow(job: CanonicalJob): PrismaCanonicalJobRow {
  return {
    canonicalJobId: job.canonicalJobId,
    title: job.title,
    company: job.company,
    location: job.location,
    description: job.description ?? null,
    url: job.url,
    mergedAt: new Date(job.mergedAt),
    fields: job.fields ?? {},
    sources: job.sources ?? [],
  };
}

/**
 * Reconstruct a `CanonicalJob` from the row shape stored in Postgres.
 * `description` survives `null → undefined` conversion to match the
 * contract; `fields` and `sources` round-trip via Prisma's `Json` /
 * `JsonB` mapping which yields plain JS objects/arrays.
 *
 * `mergedAt` MUST come back as an ISO-8601 string per the
 * `CanonicalJob` interface, so we always normalise via
 * `Date.toISOString()` regardless of whether the driver yielded a
 * native Date or a string.
 */
function fromPrismaCanonicalJobRow(row: PrismaCanonicalJobRow): CanonicalJob {
  return {
    canonicalJobId: row.canonicalJobId,
    title: row.title,
    company: row.company,
    location: row.location,
    description: row.description ?? undefined,
    url: row.url,
    mergedAt: row.mergedAt instanceof Date
      ? row.mergedAt.toISOString()
      : String(row.mergedAt),
    fields: (row.fields ?? {}) as CanonicalJob['fields'],
    sources: (row.sources ?? []) as CanonicalJob['sources'],
  };
}

/**
 * Build the Prisma `where` clause for `listByQuery`. Combines:
 *
 *   - `company` / `title` / `location`: `ILIKE '%term%'` via Prisma's
 *     `{ contains, mode: 'insensitive' }`. Backed by the `pg_trgm` GIN
 *     trigram indexes from `0_init/migration.sql`.
 *   - `since`: lower-bound (inclusive) on `mergedAt`.
 *   - `cursor`: keyset predicate to resume after a previous page.
 *
 * Returns `undefined` when no filters and no cursor were supplied so
 * the planner sees a clean ORDER BY ... LIMIT ... query.
 */
function buildWhereClause(
  query: JobStoreQuery,
  cursor: PostgresCursor | undefined,
): Record<string, unknown> | undefined {
  const conditions: Record<string, unknown>[] = [];

  if (query.company) {
    conditions.push({
      company: { contains: query.company, mode: 'insensitive' },
    });
  }
  if (query.title) {
    conditions.push({
      title: { contains: query.title, mode: 'insensitive' },
    });
  }
  if (query.location) {
    conditions.push({
      location: { contains: query.location, mode: 'insensitive' },
    });
  }
  if (query.since instanceof Date) {
    conditions.push({ mergedAt: { gte: query.since } });
  }
  if (cursor) {
    conditions.push(buildCursorWherePredicate(cursor));
  }

  if (conditions.length === 0) return undefined;
  if (conditions.length === 1) return conditions[0];
  return { AND: conditions };
}

/**
 * Build the Prisma `where` predicate that resumes pagination after a
 * keyset cursor. Equivalent SQL:
 *
 *   merged_at < cursor.mergedAt
 *   OR (merged_at = cursor.mergedAt AND canonical_job_id > cursor.canonicalJobId)
 *
 * (Note the asymmetry — `<` for the DESC column, `>` for the ASC
 * tie-break.) The Postgres planner picks `idx_canonical_job_merged_at_id`
 * for this predicate and seeks via a single B-tree probe regardless of
 * how deep the page is; this is what keeps `listByQuery` inside Spec 004
 * NFR-1's <50 ms p95 budget on multi-million-row cohorts.
 */
function buildCursorWherePredicate(
  cursor: PostgresCursor,
): Record<string, unknown> {
  const cursorMergedAt = new Date(cursor.mergedAt);
  return {
    OR: [
      { mergedAt: { lt: cursorMergedAt } },
      {
        mergedAt: cursorMergedAt,
        canonicalJobId: { gt: cursor.canonicalJobId },
      },
    ],
  };
}
