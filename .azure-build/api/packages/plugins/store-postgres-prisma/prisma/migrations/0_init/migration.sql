-- @ever-jobs/store-postgres-prisma — initial migration (Spec 004 / Phase 4 / T09).
--
-- Hand-authored (not `prisma migrate dev`-generated) so the
-- pg_trgm extension setup and the GIN trigram indexes that back FR-7's
-- case-insensitive substring filter live in the same file as the schema.
-- A future `prisma migrate dev` MUST produce byte-identical SQL save for
-- whitespace and Prisma's `_prisma_migrations` bookkeeping.
--
-- Tables created:
--   - canonical_job          (primary; one row per deduped job).
--   - source_observation     (1-N child of canonical_job; FK CASCADE).
--
-- Indexes created:
--   - idx_canonical_job_merged_at_id      — composite (merged_at DESC,
--                                            canonical_job_id ASC); backs
--                                            keyset pagination in
--                                            listByQuery.
--   - idx_canonical_job_company_trgm      — GIN trigram for ILIKE on
--                                            company.
--   - idx_canonical_job_title_trgm        — GIN trigram for ILIKE on title.
--   - idx_canonical_job_location_trgm     — GIN trigram for ILIKE on
--                                            location.
--   - idx_source_observation_canonical_job_id — backs FK and
--                                                listByCanonicalId.
--
-- Why hand-authored:
--   1. Prisma 5.x does not currently emit `pg_trgm` GIN indexes through
--      the schema-DSL (the `@@index(type: Gin)` syntax is supported but
--      the trigram opclass requires raw SQL since Prisma's generator
--      has no way to express `gin_trgm_ops`).
--   2. `CREATE EXTENSION IF NOT EXISTS pg_trgm` MUST run before the GIN
--      indexes; we want both in one transactional migration so a clean-
--      install Postgres comes up with both at once.
--   3. Operators reviewing this migration see exactly what their
--      database will gain — no hidden codegen step between schema.prisma
--      and the SQL applied to their DB.

-- =====================================================================
-- 1. Extensions
-- =====================================================================

-- pg_trgm enables trigram similarity operators and indexes (`%`, `<%`,
-- `<<%`) plus the `gin_trgm_ops` opclass needed for GIN indexes that
-- accelerate `ILIKE '%term%'` substring search. Without this, the
-- B-tree fallback would degrade to seq scan on a million-row dataset
-- and miss the Spec 004 / NFR-1 < 50 ms p95 budget.
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================================
-- 2. canonical_job
-- =====================================================================

CREATE TABLE "canonical_job" (
  "canonical_job_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "location" TEXT NOT NULL,
  "description" TEXT,
  "url" TEXT NOT NULL,
  "merged_at" TIMESTAMPTZ(6) NOT NULL,
  "fields_json" JSONB NOT NULL DEFAULT '{}',
  "sources_json" JSONB NOT NULL DEFAULT '[]',

  CONSTRAINT "canonical_job_pkey" PRIMARY KEY ("canonical_job_id")
);

-- Backs deterministic listing order and the keyset cursor seek
-- (Spec 004 §7.1 / NFR-1). Composite (merged_at DESC, canonical_job_id
-- ASC) — direction must match the planner's keyset rewrite.
CREATE INDEX "idx_canonical_job_merged_at_id"
  ON "canonical_job" ("merged_at" DESC, "canonical_job_id" ASC);

-- GIN trigram indexes for case-insensitive substring search (FR-7).
-- Used by `WHERE company ILIKE '%term%'` and equivalents on title /
-- location. The operator class `gin_trgm_ops` is what makes ILIKE
-- substring search use the index — without the opclass, Postgres
-- falls back to seq scan even when the GIN index exists.
CREATE INDEX "idx_canonical_job_company_trgm"
  ON "canonical_job" USING GIN ("company" gin_trgm_ops);
CREATE INDEX "idx_canonical_job_title_trgm"
  ON "canonical_job" USING GIN ("title" gin_trgm_ops);
CREATE INDEX "idx_canonical_job_location_trgm"
  ON "canonical_job" USING GIN ("location" gin_trgm_ops);

-- =====================================================================
-- 3. source_observation
-- =====================================================================

CREATE TABLE "source_observation" (
  "canonical_job_id" TEXT NOT NULL,
  "site" TEXT NOT NULL,
  "source_job_id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "observed_at" TIMESTAMPTZ(6) NOT NULL,
  "raw_title" TEXT,

  -- Composite primary key — defence-in-depth against double-write
  -- bugs at the SQL layer (FR-2). The dedup engine's replace-not-merge
  -- contract already guarantees uniqueness within a single putAll,
  -- but the PK constraint catches drift before it corrupts the cohort.
  CONSTRAINT "source_observation_pkey"
    PRIMARY KEY ("canonical_job_id", "site", "source_job_id")
);

-- FK to canonical_job — ON DELETE CASCADE drops attached observations
-- when their parent canonical row is deleted (FR-1 / FR-2 cascade
-- contract). Postgres enforces FKs unconditionally — no PRAGMA toggle
-- required (unlike SQLite).
ALTER TABLE "source_observation"
  ADD CONSTRAINT "source_observation_canonical_job_id_fkey"
  FOREIGN KEY ("canonical_job_id")
  REFERENCES "canonical_job" ("canonical_job_id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- Backs FK lookups and listByCanonicalId queries.
CREATE INDEX "idx_source_observation_canonical_job_id"
  ON "source_observation" ("canonical_job_id");
