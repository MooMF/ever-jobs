/**
 * TypeScript interfaces for the Skeeled public board SSR data island.
 *
 * The board page (`/board/{boardId}`) embeds the full offer catalogue in a
 * Nuxt SSR JSON data island (`<script id="__NUXT_DATA__">`). After the island's
 * flattened reference array is dereferenced, each offer takes the shape modelled
 * below. All fields are optional/nullable because the wire data is sparse —
 * `contract`, `salary`, and `jobCategory` are frequently absent, and the i18n
 * `title` / `description` maps carry tenant-varying language keys.
 *
 * Verified live 2026-06-03 against `app.skeeled.com/board/63ff6b1561114076fed6be2d`
 * (CBL s.a, LU) and `…/board/62729efbe4a2052d5d569fcd` (BE tenant, 44 offers).
 */

/** A localised text map keyed by ISO-639-1 language code (e.g. `{ fr: "…", en: "…" }`). */
export type SkeeledI18nText = Record<string, string | null | undefined>;

/** Structured postal address embedded in `information.address`. */
export interface SkeeledAddress {
  /** ISO-3166 alpha-2 country code (e.g. `"LU"`, `"BE"`). */
  country?: string | null;
  /** City / locality (e.g. `"Niederkorn"`, `"Bruxelles"`). */
  city?: string | null;
  /** Postal code (e.g. `"4578"`). */
  postCode?: string | null;
  /** Street name. */
  street?: string | null;
  /** House / building number. */
  number?: string | null;
  /** IANA timezone (e.g. `"Europe/Luxembourg"`). */
  timezone?: string | null;
}

/** Contract metadata embedded in `information.contract`. */
export interface SkeeledContract {
  /** Contract type token (e.g. `"permanent_contract"`, `"fixed_term_contract"`). */
  type?: string | null;
  /** Contracted hours per week (e.g. `40`). */
  hoursPerWeek?: number | null;
  /** Employment-type tokens (e.g. `["full_time"]`, `["part_time"]`). */
  employmentTypes?: string[] | null;
}

/** Salary band embedded in `information.salary`. */
export interface SkeeledSalary {
  /** Lower bound. */
  min?: number | null;
  /** Upper bound. */
  max?: number | null;
  /** Pay interval token (e.g. `"year"`, `"month"`, `"hour"`). */
  interval?: string | null;
  /** ISO-4217 currency code when present (e.g. `"EUR"`). */
  currency?: string | null;
}

/** Logo / branding embedded in `presentation.logo`. */
export interface SkeeledLogo {
  /** Display name of the logo asset (often the tenant brand, e.g. `"CBL Logo"`). */
  name?: string | null;
  /** Absolute URL of the logo image. */
  url?: string | null;
  /** Internal asset id. */
  _id?: string | null;
}

/** The `presentation` block of an offer wrapper. */
export interface SkeeledPresentation {
  /** Tenant branding / logo. */
  logo?: SkeeledLogo | null;
}

/** Canonical URL block (`url`) of an offer wrapper. */
export interface SkeeledOfferUrl {
  /** Public canonical offer URL (e.g. `"https://app.skeeled.com/offer/c/{offerId}"`). */
  canonical?: string | null;
}

/** The `information` block carrying the core job fields. */
export interface SkeeledOfferInformation {
  /** Localised job title map. */
  title?: SkeeledI18nText | null;
  /** Localised HTML description map. */
  description?: SkeeledI18nText | null;
  /** Structured location. */
  address?: SkeeledAddress | null;
  /** Contract details. */
  contract?: SkeeledContract | null;
  /** Job category / function token (e.g. `"construction"`, `"engineering"`). */
  jobCategory?: string | null;
  /** Salary band. */
  salary?: SkeeledSalary | null;
}

/**
 * One offer wrapper as dereferenced from the board's `__NUXT_DATA__` island.
 * `_id` is the internal id; the public, URL-facing offer id is parsed from
 * `url.canonical`.
 */
export interface SkeeledOffer {
  /** Internal offer id (24-hex ObjectId). Not the public URL id. */
  _id?: string | null;
  /** Canonical public URL block. */
  url?: SkeeledOfferUrl | null;
  /** Branding / presentation block. */
  presentation?: SkeeledPresentation | null;
  /** Core job information. */
  information?: SkeeledOfferInformation | null;
}

/**
 * A flattened, parsed listing item — the common shape produced by both the
 * primary (`__NUXT_DATA__`) and fallback (HTML card) parse paths, ready to map
 * to a `JobPostDto`.
 */
export interface SkeeledListingItem {
  /** Public offer id (24-hex), used as `atsId`. */
  offerId: string;
  /** Resolved job title (language-preferred). */
  title: string;
  /** Public canonical offer URL. */
  jobUrl: string;
  /** Resolved HTML description (language-preferred), or null when unavailable. */
  descriptionHtml?: string | null;
  /** Structured address, or null. */
  address?: SkeeledAddress | null;
  /** Contract details, or null. */
  contract?: SkeeledContract | null;
  /** Job category token, or null. */
  jobCategory?: string | null;
  /** Tenant brand / company name derived from branding, or null. */
  companyName?: string | null;
}
