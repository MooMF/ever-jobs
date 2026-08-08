/**
 * TypeScript interfaces for the Beetween public career-page wire shape.
 *
 * Beetween's documented API is a PUSH connector (Beetween posts offers out to
 * job boards), so there is no single documented public READ JSON endpoint that
 * returns a tenant's open-role list. These interfaces therefore model the two
 * surfaces the adapter actually consumes, defensively:
 *
 *  1. An inlined JSON hydration blob the career SPA may embed in its HTML (a
 *     `window.__BEETWEEN_STATE__` / `<script type="application/json">` payload).
 *     Field names mirror the platform's `camelCase` conventions, with a handful
 *     of `snake_case` aliases so minor cross-tenant or future-version drift never
 *     breaks the parser.
 *
 *  2. A server-rendered HTML fallback: when no JSON blob is present the adapter
 *     scrapes `/poste/{publicId}-{slug}/` offer links into the lightweight
 *     `BeetweenScrapedOffer` shape below.
 */

/** A single open role as it may appear in an inlined hydration blob. */
export interface BeetweenJob {
  /**
   * Beetween public id — a 10–20 char lower-case ASCII alphanumeric token,
   * auto-generated when the offer goes online. Used as the ATS id.
   */
  publicId?: string | null;
  public_id?: string | null;
  id?: string | number | null;
  reference?: string | null;

  /** Job display title. */
  title?: string | null;
  name?: string | null;
  label?: string | null;

  /** URL-friendly slug (trailing segment of the `/poste/{id}-{slug}/` URL). */
  slug?: string | null;

  /** Absolute or relative public job-detail / apply URL. */
  url?: string | null;
  link?: string | null;
  applyUrl?: string | null;
  apply_url?: string | null;

  /** Full job-ad body — HTML and/or pre-stripped plain text. */
  description?: string | null;
  descriptionHtml?: string | null;
  description_html?: string | null;
  descriptionText?: string | null;
  description_text?: string | null;
  content?: string | null;

  /** ISO-8601 / locale publish & update timestamps. */
  publishedAt?: string | null;
  published_at?: string | null;
  datePosted?: string | null;
  date?: string | null;
  updatedAt?: string | null;
  updated_at?: string | null;

  /** Free-text full location string. */
  location?: string | null;
  /** Structured location parts (defensive). */
  city?: string | null;
  region?: string | null;
  state?: string | null;
  country?: string | null;

  /** Contract / employment type (free text, e.g. "CDI", "CDD", "Stage"). */
  contractType?: string | null;
  contract_type?: string | null;
  employmentType?: string | null;
  employment_type?: string | null;
  contract?: string | null;

  /** Owning team / department metadata. */
  department?: string | null;
  team?: string | null;
  category?: string | null;
  categories?: string[] | null;

  /** Remote / télétravail hints (defensive). */
  remote?: boolean | null;
  isRemote?: boolean | null;
  teleworking?: boolean | null;

  /** Free-text tag labels attached to the role. */
  tags?: string[] | null;
}

/** Top-level shape of an inlined hydration blob, if present. */
export interface BeetweenStatePayload {
  /** Tenant display name. */
  company?: string | null;
  companyName?: string | null;
  company_name?: string | null;
  tenant?: string | null;

  /** Open roles for the tenant (various plausible container keys). */
  jobs?: BeetweenJob[] | null;
  offers?: BeetweenJob[] | null;
  positions?: BeetweenJob[] | null;
  results?: BeetweenJob[] | null;
  items?: BeetweenJob[] | null;
}

/**
 * Lightweight offer harvested from server-rendered HTML when no JSON blob is
 * available: the public id, slug, absolute detail URL, and (optional) link text
 * used as a provisional title.
 */
export interface BeetweenScrapedOffer {
  publicId: string;
  slug: string;
  url: string;
  title?: string | null;
}
