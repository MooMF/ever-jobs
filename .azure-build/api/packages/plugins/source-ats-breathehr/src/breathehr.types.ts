/**
 * TypeScript interfaces for the Breathe HR public careers surface.
 *
 * A Breathe tenant publishes each open role as a public, server-rendered HTML vacancy page at
 * `https://hr.breathehr.com/v/{slug}-{id}`. The adapter harvests those `/v/{slug}-{id}` share
 * links from the tenant's own public careers page (`companyUrl`), then fetches and parses each
 * vacancy page's stable class-named markup (`.job-title`, `.vacancy-company`, `.salary`,
 * `.location`, `.vacancy-date`, `.trix-content`). The interfaces below describe the subset of
 * that page the adapter reads plus the normalised internal role assembled from it. Everything
 * the adapter reads is optional and defensively narrowed at parse time, so cross-tenant or
 * future-shape drift never breaks the parser.
 */

/**
 * A harvested vacancy share link from a tenant's careers page (or a directly-supplied token).
 * Carries the absolute detail URL plus the `{slug}-{id}` token and its trailing numeric vacancy
 * id (the ATS id).
 */
export interface BreatheHrVacancyRef {
  /** Absolute public detail URL (`https://hr.breathehr.com/v/{slug}-{id}`). */
  url: string;
  /** The `{slug}-{id}` path token (e.g. `advocacy-worker-43996`). */
  token: string;
  /** Stable numeric vacancy id parsed from the token's trailing `-{id}` (the ATS id). */
  vacancyId: string;
}

/**
 * The raw fields scraped from a single `/v/{slug}-{id}` vacancy page before normalisation. All
 * fields are optional — any one may be absent on a given tenant's page and is narrowed
 * defensively.
 */
export interface BreatheHrVacancyPage {
  /** Role title text (`<div class='job-title'>`). */
  title?: string | null;
  /** Tenant / employer display name (`<p class='vacancy-company'>` → "Vacancy at {Company}"). */
  company?: string | null;
  /** Page `<title>` text (a fallback employer name). */
  pageTitle?: string | null;
  /** Salary value text (`<div class='salary'>`, with the leading "Salary" label stripped). */
  salary?: string | null;
  /** Free-text location line (`<div class='location'>`). */
  location?: string | null;
  /** "Vacancy listed" date text (`DD/MM/YYYY`) — the posted date. */
  listedDate?: string | null;
  /** "Application deadline" date text (`DD/MM/YYYY`) — the closing date. */
  deadlineDate?: string | null;
  /** Rich HTML description body (`<div class='trix-content'>` and sibling detail sections). */
  descriptionHtml?: string | null;
  /** Canonical URL from `<meta property='og:url'>`, when present. */
  canonicalUrl?: string | null;
}

/**
 * Normalised view of a single Breathe HR role, ready to map to a JobPostDto.
 */
export interface BreatheHrJob {
  /** Stable ATS id (the trailing numeric vacancy id). */
  atsId: string;

  /** Absolute public detail URL (the canonical `/v/{slug}-{id}`). */
  url: string;

  /** Absolute public apply URL (the same detail page hosts the apply flow). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant / employer company display name. */
  companyName?: string | null;

  /** Free-text location line, used for the LocationDto and remote detection. */
  locationText?: string | null;

  /** Role description body (HTML when present), else null. */
  descriptionHtml?: string | null;

  /** Salary text, when present (informational — surfaced in the description context). */
  salary?: string | null;

  /** Posted date — parsed from the "Vacancy listed" date, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working / hybrid. */
  isRemote?: boolean | null;
}
