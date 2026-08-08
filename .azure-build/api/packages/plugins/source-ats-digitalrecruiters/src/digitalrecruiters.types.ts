/**
 * TypeScript interfaces for the DigitalRecruiters public career-site API.
 *
 * Field names mirror the real wire shape (`snake_case`) returned by the public
 * API at `https://api.digitalrecruiters.com`. Every field is optional/nullable
 * to tolerate sparse or tenant-varying responses.
 *
 * Three endpoints contribute to the full job record:
 *   - `GET  /careers/v1/careers-sites/{host}`        → {@link DigitalRecruitersSiteConfig}
 *   - `POST /public/v1/careers-site/job-ads`         → {@link DigitalRecruitersJobListResponse}
 *   - `GET  /public/v1/careers-site/job-ads/{id}`    → {@link DigitalRecruitersJobDetail}
 */

/** A locale entry in the careers-site config. */
export interface DigitalRecruitersLocale {
  iso_code?: string | null;
  title?: string | null;
}

/**
 * Careers-site config returned by `GET /careers/v1/careers-sites/{host}`.
 * Used to resolve the canonical career `domain_name` and the default locale
 * the job-ads endpoint expects.
 */
export interface DigitalRecruitersSiteConfig {
  internal_id?: string | null;
  /** Canonical career domain (e.g. "careers.acme.com") — the job-ads `domainName`. */
  domain_name?: string | null;
  is_online?: boolean | null;
  available_locales?: DigitalRecruitersLocale[] | null;
  default_locale?: DigitalRecruitersLocale | null;
  mark_id?: number | null;
  child_account_name?: string | null;
  /** Human-readable career-site name (e.g. "Acme careers"). */
  name?: string | null;
  type?: number | null;
  is_multibrand?: boolean | null;
}

/** A media reference embedded in a job-ad row / detail. */
export interface DigitalRecruitersImage {
  alt?: string | null;
  src?: string | null;
  extra_sources?: unknown;
}

/** Summary row from `POST /public/v1/careers-site/job-ads` inside `items[]`. */
export interface DigitalRecruitersJobListItem {
  /** Composite id "{job_ad_id}-{address_id}". */
  id?: string | null;
  /** Numeric job-ad id — used by the detail endpoint and the public page URL. */
  job_ad_id?: number | null;
  /** Job-ad title (localised). */
  title?: string | null;
  /** Contract label (e.g. "Permanent Contract", "CDI"). */
  contract?: string | null;
  /** Free-text location label (e.g. "Caen", "14000 Caen"). */
  location?: string | null;
  /** Job-function / category label (e.g. "ELECTRICAL CAD DESIGNER"). */
  job?: string | null;
  /** URL slug ("{job_ad_id}-{hyphenated-title-location}") for the public page. */
  url?: string | null;
  image?: DigitalRecruitersImage | null;
  image_wide?: DigitalRecruitersImage | null;
  score?: number | null;
  brand_id?: number | null;
  is_external?: boolean | null;
  is_aggregated?: boolean | null;
  /** Canonical career domain this row belongs to. */
  career_domain?: string | null;
  careers_site_url?: string | null;
  broadcast_hash?: string | null;
}

/** Top-level response from `POST /public/v1/careers-site/job-ads`. */
export interface DigitalRecruitersJobListResponse {
  /** Total open-role count for the tenant. */
  count?: number | null;
  items?: DigitalRecruitersJobListItem[] | null;
}

/** Structured address embedded in a job-ad detail. */
export interface DigitalRecruitersAddress {
  id?: number | null;
  street?: string | null;
  zip?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  location?: { lat?: number | null; lng?: number | null } | null;
}

/** schema.org JobPosting JSON-LD embedded in a detail response. */
export interface DigitalRecruitersJsonLd {
  '@context'?: string | null;
  '@type'?: string | null;
  /** ISO date string (e.g. "2026-06-03"). */
  datePosted?: string | null;
  /** Array of schema.org employment-type tokens (e.g. ["FULL_TIME"]). */
  employmentType?: string[] | null;
  identifier?: unknown;
  jobLocation?: unknown;
  baseSalary?: unknown;
  hiringOrganization?: { name?: string | null } | null;
  title?: string | null;
  description?: string | null;
}

/** Detailed job record from `GET /public/v1/careers-site/job-ads/{job_ad_id}`. */
export interface DigitalRecruitersJobDetail {
  id?: string | null;
  company_id?: number | null;
  mark_id?: number | null;
  job_ad_id?: number | null;
  locale?: string | null;
  node_id?: number | null;
  brand_id?: number | null;
  job_ad_status?: number | null;
  contract_type_id?: number | null;
  /** e.g. "Full-time", "Part-time". */
  working_time?: string | null;
  /** Publish/refresh timestamp (e.g. "2026-06-03 13:07:18"). */
  republished_at?: string | null;
  education_level?: string | null;
  job_experience?: string | null;
  brand_name?: string | null;
  skills?: unknown[] | null;
  job?: Array<{ id?: number | null; label?: string | null }> | null;
  address?: DigitalRecruitersAddress | null;
  formatted_address?: string | null;
  career_domain?: string | null;
  url?: string | null;
  title?: string | null;
  catch_phrase?: string | null;
  /** HTML job description fragment — primary description source. */
  description?: string | null;
  /** HTML candidate-profile fragment — appended to the description when present. */
  profile?: string | null;
  contract?: string | null;
  location?: string | null;
  apply_email?: string | null;
  is_external?: boolean | null;
  is_aggregated?: boolean | null;
  jsonld?: DigitalRecruitersJsonLd | null;
}
