/**
 * TypeScript interfaces for the Sage HR public careers-site surface.
 *
 * Two surfaces contribute to a full job record:
 *   - The vacancies listing page (`GET /{careerSiteId}/vacancies`) yields
 *     lightweight {@link SageHrListingItem} rows parsed from `<div class="job">`
 *     cards (position id, title, detail URL, free-text location).
 *   - The position detail page (`GET /jobs/{positionId}`) enriches a row with
 *     the employment-type chip, a structured location chip, the company name
 *     (logo `alt`), and the full HTML description, modelled by
 *     {@link SageHrDetail}.
 *
 * Field names mirror the rendered careers-site markup. A handful of defensive
 * aliases are modelled so minor cross-tenant markup drift never breaks the
 * parser. All fields are optional / nullable to tolerate sparse responses.
 */

/** A job-listing row parsed from one `<div class="job">` card. */
export interface SageHrListingItem {
  /** Position UUID extracted from the detail-page URL (`/jobs/{positionId}`). */
  positionId?: string | null;
  /** Job title text from the card title anchor. */
  title?: string | null;
  /** Absolute canonical detail-page URL (`https://talent.sage.hr/jobs/{positionId}`). */
  detailUrl?: string | null;
  /** Free-text location label from the card (e.g. "Germany"). */
  location?: string | null;
}

/**
 * Enrichment fields scraped from a position detail page (`/jobs/{positionId}`).
 * Every field is optional — a detail fetch failure leaves the listing row to
 * stand on its own.
 */
export interface SageHrDetail {
  /** Job title from `.title-wrap h1` (fallback to the listing title). */
  title?: string | null;
  /** Short company / tenant name from the logo `alt` attribute. */
  companyName?: string | null;
  /** Employment-type chip (e.g. "Full-time", "Part-time", "Contract"). */
  employmentType?: string | null;
  /** Location chip from `ul.with-ticks li.globe-tick` (e.g. "Germany"). */
  locationChip?: string | null;
  /** Full job-description HTML, concatenated from the `.block-content` blocks. */
  descriptionHtml?: string | null;
}

/**
 * A merged job record combining the listing row with the optional detail-page
 * enrichment. Either side's fields may be absent; mapping tolerates a missing
 * detail.
 */
export interface SageHrJob extends SageHrListingItem {
  detail?: SageHrDetail | null;
}
