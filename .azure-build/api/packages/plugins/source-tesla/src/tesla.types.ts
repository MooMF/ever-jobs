/**
 * Spec 013 / T07 — Tesla internal types.
 *
 * Mirrors the JSON envelopes returned by Tesla's `/cua-api/apps/careers/state`
 * (board) and `/cua-api/careers/job/{id}` (detail) endpoints. Keeping
 * the types in a dedicated file lets the unit tests (T08) import the
 * same shape when constructing fixtures without re-declaring it.
 *
 * Field set is INTENTIONALLY narrow — only the fields we map into
 * `JobPostDto` are typed. Upstream returns ~40 additional fields
 * (recruiter contacts, requisition flags, internal-vs-external
 * routing tags) that we deliberately skip for this batch.
 */

/** Single board listing entry inside `listings[]`. */
export interface TeslaBoardListing {
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

/**
 * `lookup` sub-object of the board envelope. Upstream maps short keys
 * (`l`, `d`, `r`) on each listing to display strings via these
 * dictionaries. Keeping each map's value as `string` is intentional —
 * upstream occasionally returns objects for richer locations (with
 * city/state/country fields) but the canonical `JobPostDto.location`
 * is a `LocationDto.city` string and we do not parse the richer shape
 * in this batch.
 */
export interface TeslaBoardLookup {
  locations?: Record<string, string>;
  departments?: Record<string, string>;
  regions?: Record<string, string>;
}

/** Top-level JSON envelope returned by the board endpoint. */
export interface TeslaBoardResponse {
  listings?: TeslaBoardListing[];
  lookup?: TeslaBoardLookup;
}

/**
 * Per-job detail envelope returned by `/cua-api/careers/job/{id}`.
 * The four free-text fields are concatenated into
 * `JobPostDto.description` per upstream Python's `\n\n`.join pattern.
 */
export interface TeslaJobDetail {
  jobDescription?: string | null;
  jobResponsibilities?: string | null;
  jobRequirements?: string | null;
  jobCompensationAndBenefits?: string | null;
  department?: string | null;
  timeType?: string | null;
}
