/**
 * TypeScript interfaces for the ApplicantPro public job-board surface.
 *
 * ApplicantPro does not expose a single JSON list feed; the listing page is
 * client-rendered. The adapter therefore enumerates a tenant's open roles from
 * its XML sitemap (`/sitemap.xml`) and parses each server-rendered detail page
 * (`/jobs/{jobId}.html`). The interfaces below model the normalised, parsed
 * shape the adapter extracts from those documents. Field names mirror the wire
 * meaning; a handful of `snake_case`/`camelCase` aliases are modelled
 * defensively so minor cross-tenant or future-version markup drift never breaks
 * the parser.
 */

/** A single sitemap entry pointing at an open role's detail page. */
export interface ApplicantProSitemapEntry {
  /** Numeric job id parsed from `…/jobs/{jobId}.html`. Used as the ATS id. */
  jobId: string;
  /** Absolute detail-page URL (`https://{tenant}.applicantpro.com/jobs/{jobId}.html`). */
  url: string;
  /** ISO-ish `<lastmod>` value from the sitemap, when present. */
  lastmod?: string | null;
}

/**
 * Inline `jobInfo` object embedded in a detail page's `JobDetail` Vue mount.
 * Each field is a pre-formatted display string ("Posted …", "City, State,
 * Country", an employment-type label).
 */
export interface ApplicantProJobInfo {
  /** e.g. "Posted 06-Feb-2019 (EST)". */
  mdiCalendar?: string | null;
  /** e.g. "Washington, DC, USA". */
  mdiMapMarker?: string | null;
  /** e.g. "Full Time" / "Regular Full Time". */
  mdiInbox?: string | null;
}

/**
 * Normalised view of a single ApplicantPro role, assembled from its sitemap
 * entry and its parsed detail page.
 */
export interface ApplicantProJob {
  /** Numeric job id — used as the ATS id. */
  jobId: string;

  /** Absolute public detail-page / apply URL. */
  url: string;
  /** Canonical `www.applicantpro.com/openings/…` URL from `og:url`, when present. */
  canonicalUrl?: string | null;

  /** Job display title (from `og:title` / `<title>` / `keywords`). */
  title?: string | null;

  /** Tenant company display name (from the `JobDetail` mount's `domainTitle`). */
  company?: string | null;
  companyName?: string | null;

  /** Full job-ad body text (from `og:description` / meta description). */
  description?: string | null;
  /** Full job-ad body as HTML, when a richer markup body is available. */
  descriptionHtml?: string | null;

  /** Structured location parts parsed from `keywords` / `jobInfo.mdiMapMarker`. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Department / org-unit label (the trailing `keywords` segment). */
  department?: string | null;

  /** Employment-type label (from `jobInfo.mdiInbox`). */
  employmentType?: string | null;

  /** Posted date — `DD-Mon-YYYY` parsed from `jobInfo.mdiCalendar`, else `<lastmod>`. */
  datePosted?: string | null;

  /** Raw parsed `jobInfo` blob (retained for completeness / future fields). */
  jobInfo?: ApplicantProJobInfo | null;
}
