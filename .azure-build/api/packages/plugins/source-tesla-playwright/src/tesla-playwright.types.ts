/**
 * Spec 013 / T09 — Tesla-Playwright internal types.
 *
 * Mirrors the JSON envelopes returned by Tesla's
 * `/cua-api/apps/careers/state` (board) and `/cua-api/careers/job/{id}`
 * (detail) endpoints — same shape as the default `source-tesla`
 * package's types but DUPLICATED locally here per `AGENTS.md §5`'s
 * "no peer plugin imports" rule. Field set is intentionally narrow —
 * only the fields we map into `JobPostDto`.
 */

/** Single board listing entry inside `listings[]` (upstream's short keys). */
export interface TeslaPlaywrightBoardListing {
  /** Stable ID used for `JobPostDto.id` / `(site, externalId)` (FR-20). */
  id: string;
  /** Job title (upstream's `t` short-name field). */
  t: string;
  /** Location lookup key — resolved to a string via `lookup.locations[l]`. */
  l?: string | null;
  /** Department lookup key — resolved via `lookup.departments[d]` when present. */
  d?: string | null;
  /** Region lookup key — resolved via `lookup.regions[r]` when present. */
  r?: string | null;
  /** Internal/external routing flag (upstream's `e`). Optional. */
  e?: boolean | null;
}

/** `lookup` sub-object of the board envelope. */
export interface TeslaPlaywrightBoardLookup {
  locations?: Record<string, string>;
  departments?: Record<string, string>;
  regions?: Record<string, string>;
}

/** Top-level JSON envelope returned by the board endpoint. */
export interface TeslaPlaywrightBoardResponse {
  listings?: TeslaPlaywrightBoardListing[];
  lookup?: TeslaPlaywrightBoardLookup;
}

/** Per-job detail envelope returned by `/cua-api/careers/job/{id}`. */
export interface TeslaPlaywrightJobDetail {
  jobDescription?: string | null;
  jobResponsibilities?: string | null;
  jobRequirements?: string | null;
  jobCompensationAndBenefits?: string | null;
  department?: string | null;
  timeType?: string | null;
}
