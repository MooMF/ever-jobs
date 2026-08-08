/**
 * TypeScript interfaces for the TempWorks public Job Board surface.
 *
 * TempWorks does not expose a public, unauthenticated JSON list feed; the
 * candidate-facing Job Board is a server-rendered (ASP.NET MVC) site. The
 * adapter therefore enumerates a tenant's open orders from its jobs listing page
 * (`/{tenant}/Jobs/Search`) and enriches each from its detail page
 * (`/{tenant}/Jobs/Details/{orderId}`). The interfaces below model the
 * normalised, parsed shape the adapter extracts from those documents; the board
 * carries no schema.org JSON-LD, so every field is parsed defensively from the
 * rendered HTML and a handful are optional so minor cross-theme markup drift
 * never breaks the parser.
 */

/** A single listing-card entry pointing at an open order's detail page. */
export interface TempWorksListingEntry {
  /** Order id parsed from `…/Jobs/Details/{orderId}`. Used as the ATS id. */
  orderId: string;
  /** Absolute detail-page URL (`https://jobboard.ontempworks.com/{tenant}/Jobs/Details/{orderId}`). */
  url: string;
  /** Role title scraped from the listing card heading, when present. */
  title?: string | null;
  /** City parsed from the card's `{city}, {state}` location text, when present. */
  city?: string | null;
  /** State / region parsed from the card's `{city}, {state}` location text, when present. */
  state?: string | null;
}

/**
 * Normalised view of a single TempWorks order, assembled from its listing-card
 * entry and (optionally) its enriched detail page.
 */
export interface TempWorksJob {
  /** TempWorks order id — used as the ATS id. */
  orderId: string;

  /** Absolute public detail-page URL. */
  url: string;
  /** Public HRCenter "Apply with Us" URL when the detail page advertises one. */
  applyUrl?: string | null;

  /** Job display title (detail-page `<h1>` preferred, else the listing card). */
  title?: string | null;

  /** Tenant company display name (derived from the board tenant token). */
  companyName?: string | null;

  /** Full job-ad body as HTML (from the detail page's description block). */
  descriptionHtml?: string | null;
  /** Plain-text body fallback (from `og:description`) when no HTML body exists. */
  description?: string | null;

  /** Structured location parts parsed from the listing card / detail page. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Employment-type label, when the listing / detail surfaces one. */
  employmentType?: string | null;

  /** Department / category label, when present. */
  department?: string | null;

  /** Posted date, when the detail page surfaces one. */
  datePosted?: string | null;

  /** True when the role advertises remote / work-from-home. */
  isRemote?: boolean | null;
}
