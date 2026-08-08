import { sql } from 'drizzle-orm';
import {
  index,
  primaryKey,
  sqliteTable,
  text,
} from 'drizzle-orm/sqlite-core';

/**
 * `canonical_job` — primary table. One row per logical (deduped) job.
 *
 * Columns:
 *   - `canonical_job_id`  TEXT PRIMARY KEY — sha-256 hash from the dedup engine.
 *   - `title` / `company` / `location` / `description` / `url` — flat fields
 *     copied from {@link CanonicalJob} for ergonomic access.
 *   - `merged_at` — ISO-8601 timestamp; sortable as a string thanks to the
 *     fixed Z-suffixed format.
 *   - `fields_json` — JSON-serialised provenance map. We do NOT shard it
 *     into per-field rows because the dedup engine treats it as an opaque
 *     payload and SQLite's JSON1 extension is good enough for the rare
 *     query that needs to look inside.
 *   - `sources_json` — JSON-serialised observation array. Cheap fallback
 *     for callers that need the round-trip shape without a JOIN; the
 *     authoritative source is still {@link sourceObservation} (FR-2).
 *   - **Case-folded shadow columns** (`company_lc`, `title_lc`, `location_lc`)
 *     — populated on every insert/update via the application layer (NOT
 *     a SQLite `GENERATED ALWAYS` column, because Drizzle's migration
 *     ergonomics for generated columns are still maturing; populating
 *     in TS keeps the schema portable to other Drizzle dialects later).
 *     `LIKE`/`GLOB` on these columns is an O(N) scan; the indexes below
 *     turn that into a B-tree probe so case-insensitive substring
 *     filters stay within Spec 004 / NFR-1's < 25 ms p95 budget.
 *
 * Index strategy (Spec 004 / NFR-1):
 *   - `idx_canonical_job_merged_at_id` — composite (`merged_at` DESC,
 *     `canonical_job_id` ASC). Backs the deterministic listing order
 *     and the keyset-cursor seek in `listByQuery`.
 *   - `idx_canonical_job_company_lc` / `_title_lc` / `_location_lc` —
 *     single-column indexes for filter predicates. SQLite picks the
 *     most selective one per query plan.
 */
export const canonicalJob = sqliteTable(
  'canonical_job',
  {
    canonicalJobId: text('canonical_job_id').primaryKey().notNull(),
    title: text('title').notNull(),
    company: text('company').notNull(),
    location: text('location').notNull(),
    description: text('description'),
    url: text('url').notNull(),
    mergedAt: text('merged_at').notNull(),
    fieldsJson: text('fields_json').notNull().default('{}'),
    sourcesJson: text('sources_json').notNull().default('[]'),
    companyLc: text('company_lc').notNull(),
    titleLc: text('title_lc').notNull(),
    locationLc: text('location_lc').notNull(),
  },
  (t) => ({
    idxMergedAtId: index('idx_canonical_job_merged_at_id').on(
      t.mergedAt,
      t.canonicalJobId,
    ),
    idxCompanyLc: index('idx_canonical_job_company_lc').on(t.companyLc),
    idxTitleLc: index('idx_canonical_job_title_lc').on(t.titleLc),
    idxLocationLc: index('idx_canonical_job_location_lc').on(t.locationLc),
  }),
);

/**
 * `source_observation` — child table. One row per per-source sighting of
 * a canonical job (FR-2; 1-N to {@link canonicalJob}).
 *
 * Composite primary key `(canonical_job_id, site, source_job_id)` enforces
 * "one observation per (site, source-id) pair" — the dedup engine's
 * replace-not-merge contract guarantees no duplicates within a single
 * `putAll`, but the PK constraint catches double-write bugs at the SQL
 * layer before they corrupt the cohort.
 *
 * Foreign key with `ON DELETE CASCADE` enforces FR-1 / FR-2's cascade-
 * on-delete contract at the SQL layer (the in-memory backend does it in
 * application code; here SQLite does it for us — `delete(canonicalJobId)`
 * on `canonical_job` automatically removes every attached observation).
 *
 * NOTE: SQLite enforces `ON DELETE CASCADE` only when `PRAGMA foreign_keys
 * = ON` is set on the connection. The driver wrapper in
 * `store-sqlite-drizzle.service.ts` applies this PRAGMA in its constructor
 * — backend-specific test exercises the cascade explicitly to guard
 * against future schema-only edits forgetting the PRAGMA.
 */
export const sourceObservation = sqliteTable(
  'source_observation',
  {
    canonicalJobId: text('canonical_job_id')
      .notNull()
      .references(() => canonicalJob.canonicalJobId, { onDelete: 'cascade' }),
    site: text('site').notNull(),
    sourceJobId: text('source_job_id').notNull(),
    url: text('url').notNull(),
    observedAt: text('observed_at').notNull(),
    rawTitle: text('raw_title'),
  },
  (t) => ({
    pk: primaryKey({
      columns: [t.canonicalJobId, t.site, t.sourceJobId],
    }),
    idxCanonicalJobId: index('idx_source_observation_canonical_job_id').on(
      t.canonicalJobId,
    ),
  }),
);

/**
 * Initial schema bootstrap statement bundled with the package so a fresh
 * `:memory:` database (used by tests) can be spun up without invoking
 * `drizzle-kit migrate`. Production deployments still go through the
 * `drizzle/migrations/0000_init.sql` migration.
 *
 * Kept here (and NOT inlined into the service) so the service file
 * stays focused on the IJobStore / IJobObservationStore contract and
 * the schema source-of-truth lives in one place.
 */
export const INITIAL_SCHEMA_SQL = sql`
  CREATE TABLE IF NOT EXISTS canonical_job (
    canonical_job_id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    merged_at TEXT NOT NULL,
    fields_json TEXT NOT NULL DEFAULT '{}',
    sources_json TEXT NOT NULL DEFAULT '[]',
    company_lc TEXT NOT NULL,
    title_lc TEXT NOT NULL,
    location_lc TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_canonical_job_merged_at_id
    ON canonical_job (merged_at, canonical_job_id);
  CREATE INDEX IF NOT EXISTS idx_canonical_job_company_lc
    ON canonical_job (company_lc);
  CREATE INDEX IF NOT EXISTS idx_canonical_job_title_lc
    ON canonical_job (title_lc);
  CREATE INDEX IF NOT EXISTS idx_canonical_job_location_lc
    ON canonical_job (location_lc);
  CREATE TABLE IF NOT EXISTS source_observation (
    canonical_job_id TEXT NOT NULL,
    site TEXT NOT NULL,
    source_job_id TEXT NOT NULL,
    url TEXT NOT NULL,
    observed_at TEXT NOT NULL,
    raw_title TEXT,
    PRIMARY KEY (canonical_job_id, site, source_job_id),
    FOREIGN KEY (canonical_job_id)
      REFERENCES canonical_job (canonical_job_id)
      ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_source_observation_canonical_job_id
    ON source_observation (canonical_job_id);
`;
