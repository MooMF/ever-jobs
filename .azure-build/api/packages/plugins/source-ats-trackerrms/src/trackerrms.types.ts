/**
 * TypeScript interfaces for the TrackerRMS (tracker-rms.com) public careers surface.
 *
 * TrackerRMS does not expose a JSON job API on its public EVO Portal; instead the
 * "Publish Jobs to your Website" / "Jobs+" integration renders a server-side HTML
 * `<ul><li>…</li></ul>` fragment — one `<li>` block per open role — at
 * `https://evoportal{region}.tracker-rms.com/{database}/jobs?fields={csv}`. The
 * exact column set inside each `<li>` is tenant-configured, so there is no stable
 * wire object to model; the interfaces below describe the *parsed* shapes the
 * adapter derives from each block. Everything the adapter reads is optional and
 * defensively narrowed at parse time, so cross-tenant layout drift never breaks
 * the parser.
 */

/**
 * A single raw role block extracted from the feed fragment. `html` is the inner
 * HTML of one `<li>…</li>`; the adapter scans it for a heading, an apply link,
 * and the remaining free-text/metadata fields.
 */
export interface TrackerRmsRawItem {
  /** Inner HTML of the role's `<li>` block. */
  html: string;
  /** Apply / candidate-registration href found in the block, when present. */
  applyHref?: string | null;
}

/**
 * Normalised view of a single TrackerRMS role, assembled from a parsed `<li>`
 * block. Field names are the adapter's own (the feed has no canonical schema).
 */
export interface TrackerRmsJob {
  /** TrackerRMS reference / job code — used as the ATS id. */
  jobId: string;

  /** Absolute public apply / candidate-registration URL. */
  url: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (derived from the database name). */
  companyName?: string | null;

  /** Full job-ad body as HTML (the block's inner markup, minus the heading/link). */
  descriptionHtml?: string | null;

  /** Structured location parts derived from the rendered `location` field. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Employment-type label (from the rendered `worktype` field). */
  employmentType?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
