/**
 * TypeScript interfaces for the Radancy (TalentBrew) public career surface.
 *
 * Radancy career sites expose a public, anonymous job-results endpoint on each tenant host
 * at `GET /{lang}/search-jobs/results?ActiveFacetID=0&CurrentPage={n}&RecordsPerPage={k}&FacetType=0`,
 * which returns a small JSON envelope `{ filters, results, hasJobs, hasContent }`. The
 * `results` field is a **server-rendered HTML fragment** (a `<ul>` of job tiles), not
 * structured JSON, so the adapter parses the per-role anchor + adjacent location span out of
 * that HTML. The interfaces below describe the JSON envelope the adapter reads plus the
 * normalised internal role assembled from the parsed HTML. Everything the adapter reads is
 * optional and defensively narrowed at parse time, so cross-tenant or future template drift
 * never breaks the parser.
 */

/**
 * The top-level public results envelope `{ filters, results, hasJobs, hasContent }`. Only the
 * fields the adapter walks are modelled; `results` (and `filters`) are HTML fragments.
 */
export interface RadancyResultsResponse {
  /** Server-rendered facet/filter sidebar HTML (ignored by the adapter). */
  filters?: string | null;
  /** Server-rendered `<ul>` of job tiles — parsed for per-role data. */
  results?: string | null;
  /** Whether the board currently has any open roles. */
  hasJobs?: boolean | null;
  /** Whether the board returned any content for the request. */
  hasContent?: boolean | null;
}

/**
 * A single role parsed out of one `<li>` job tile in the `results` HTML fragment. All fields
 * are optional — a tile that lacks an anchor / id is skipped.
 */
export interface RadancyJobTile {
  /** Stable role id from the anchor's `data-job-id` (e.g. `95942349392`). */
  jobId?: string | null;
  /** Tenant org id from the save-button's `data-org-id` (e.g. `47123`), when present. */
  orgId?: string | null;
  /** Role display title (anchor text). */
  title?: string | null;
  /** Canonical detail href (relative, e.g. `/en/job/atlanta/customer-success-manager/47123/95942349392`). */
  href?: string | null;
  /** Free-text location line from the adjacent `job-location` span (e.g. `Atlanta, Georgia`). */
  location?: string | null;
}

/**
 * Normalised view of a single Radancy role, ready to map to a JobPostDto.
 */
export interface RadancyJob {
  /** Stable ATS id (the role `data-job-id`, e.g. `95942349392`). */
  atsId: string;

  /** Absolute public detail URL (the anchor href resolved against the tenant host). */
  url: string;

  /** Absolute public apply URL (the same detail page hosts the apply flow). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (de-slugified host label — the fragment carries no brand). */
  companyName?: string | null;

  /** Free-text location line (the list fragment carries an unstructured single line). */
  locationText?: string | null;

  /** True when the role advertises remote / home-working (title / location regex). */
  isRemote?: boolean | null;
}
