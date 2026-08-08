/**
 * TypeScript interfaces for the Sympa public careers surface.
 *
 * A Sympa tenant board (`{slug}.recruitee.com`) is backed by a single public, anonymous JSON
 * offers feed `GET {slug}.recruitee.com/api/offers/`, which returns the tenant's full
 * published-offer set as `{ offers: [ …role… ] }`. The adapter GETs the feed once, keeps only
 * `published` roles, and maps each. The interfaces below describe the subset of that wire shape
 * the adapter reads plus the normalised internal role assembled from it. Everything the adapter
 * reads is optional and defensively narrowed at parse time, so cross-tenant or future-shape
 * drift never breaks the parser.
 */

/**
 * A nested location entry on a role (`locations: [ { id, name, city, state, country, … } ]`).
 * The role also exposes flattened top-level `city` / `country` fields, which the adapter
 * prefers; this nested block is modelled defensively as a fallback.
 */
export interface SympaOfferLocation {
  /** Location id. */
  id?: number | string | null;
  /** Display name (often the city). */
  name?: string | null;
  /** City. */
  city?: string | null;
  /** State / region. */
  state?: string | null;
  /** Country. */
  country?: string | null;
  /** ISO country code (e.g. `RO`, `FI`). */
  country_code?: string | null;
}

/**
 * A single role as returned in the offers feed's `offers[]`. Only the fields the adapter
 * consumes are modelled; all are optional and defensively narrowed.
 */
export interface SympaOffer {
  /** Stable numeric role id — the ATS id (e.g. `2620732`). */
  id?: number | string | null;
  /** URL-safe role slug (e.g. `aml-branch-manager-romania`). */
  slug?: string | null;
  /** Role display title. */
  title?: string | null;
  /** Lifecycle status — `published` for live, candidate-facing roles. */
  status?: string | null;
  /** Canonical public detail-page URL (`https://{board}/o/{slug}`). */
  careers_url?: string | null;
  /** Canonical public apply-page URL (`https://{board}/o/{slug}/c/new`). */
  careers_apply_url?: string | null;
  /** Free-text city (e.g. `Bucharest`). */
  city?: string | null;
  /** State / region display name (e.g. `București`). */
  state_name?: string | null;
  /** State / region code (e.g. `B`). */
  state_code?: string | null;
  /** Free-text country (e.g. `Romania`). */
  country?: string | null;
  /** ISO country code (e.g. `RO`). */
  country_code?: string | null;
  /** Combined free-text location line (e.g. `Bucharest, București, Romania`). */
  location?: string | null;
  /** Nested structured location entries (fallback to the flattened fields). */
  locations?: SympaOfferLocation[] | null;
  /** Department / team label (e.g. `Support & Operations`). */
  department?: string | null;
  /** Category code (e.g. `banking`) — a coarse classification, used as a department fallback. */
  category_code?: string | null;
  /** Employment-type code (e.g. `fulltime_permanent`, `parttime_temporary`). */
  employment_type_code?: string | null;
  /** True when the role is fully remote. */
  remote?: boolean | null;
  /** True when the role is hybrid (part-remote). */
  hybrid?: boolean | null;
  /** True when the role is fully on-site. */
  on_site?: boolean | null;
  /** Rendered HTML description body. */
  description?: string | null;
  /** Rendered HTML requirements body (appended to the description when present). */
  requirements?: string | null;
  /** Company display name on the role (the tenant brand). */
  company_name?: string | null;
  /** Per-role inbound mailbox address (a harvestable contact email). */
  mailbox_email?: string | null;
  /** Creation timestamp (`YYYY-MM-DD HH:MM:SS UTC`). */
  created_at?: string | null;
  /** Publish timestamp (`YYYY-MM-DD HH:MM:SS UTC`). */
  published_at?: string | null;
}

/**
 * The offers-feed envelope (`{ offers: [ …role… ] }`). Only the path the adapter reads is
 * modelled; `offers` is narrowed to an array at parse time.
 */
export interface SympaOffersResponse {
  /** The tenant's published (and other-state) roles. */
  offers?: SympaOffer[] | null;
}

/**
 * Normalised view of a single Sympa role, ready to map to a JobPostDto.
 */
export interface SympaJob {
  /** Stable ATS id (the role `id`, e.g. `2620732`). */
  atsId: string;

  /** Absolute public detail URL (the canonical `careers_url`). */
  url: string;

  /** Absolute public apply URL (the canonical `careers_apply_url`, else the detail URL). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant / brand company display name. */
  companyName?: string | null;

  /** Structured location parts derived from the role's city / state / country. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Combined free-text location, used for remote detection. */
  locationText?: string | null;

  /** Role description body (HTML when present), else null. */
  descriptionHtml?: string | null;

  /** Per-role inbound mailbox address, harvested as a contact email. */
  mailboxEmail?: string | null;

  /** Department label, derived from the role's department / category. */
  department?: string | null;

  /** Employment-type label (e.g. `fulltime_permanent`). */
  employmentType?: string | null;

  /** Posted date — parsed from `published_at` (fallback `created_at`), when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / hybrid / home-working. */
  isRemote?: boolean | null;
}
