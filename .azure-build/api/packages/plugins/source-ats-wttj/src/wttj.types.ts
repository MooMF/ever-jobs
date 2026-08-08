/**
 * TypeScript interfaces for the Welcome to the Jungle (WTTJ) public careers surface.
 *
 * WTTJ company jobs pages (`welcometothejungle.com/{lang}/companies/{slug}/jobs`) are
 * powered by a public, anonymous Algolia search index. The adapter queries that index
 * directly (`POST …/indexes/{index}/query` with a `facetFilters` of
 * `["organization.slug:{slug}"]`) and maps each returned hit. The interfaces below
 * describe the subset of the Algolia hit wire shape the adapter reads plus the
 * normalised internal role assembled from it. Everything the adapter reads is optional
 * and defensively narrowed at parse time, so cross-company or future-shape drift never
 * breaks the parser.
 */

/**
 * A single structured office (workplace) attached to a job hit. WTTJ splits a role's
 * location into one or more offices, each carrying city / state / country parts.
 */
export interface WttjOffice {
  /** City label (e.g. `Auxerre`). */
  city?: string | null;
  /** State / region label (e.g. `Bourgogne-Franche-Comte`). */
  state?: string | null;
  /** Country label (e.g. `France`). */
  country?: string | null;
  /** ISO country code (e.g. `FR`). */
  country_code?: string | null;
  /** Administrative district, when present. */
  district?: string | null;
}

/**
 * The role's profession classification, as embedded in an Algolia hit (`new_profession`).
 * Only the human-readable category / sub-category labels are consumed.
 */
export interface WttjProfession {
  /** Top-level category label (e.g. `Business & Finance`). */
  category_name?: string | null;
  /** Sub-category label (e.g. `Executive`). */
  sub_category_name?: string | null;
  /** Free-text pivot / role label (e.g. `Sector Manager`). */
  pivot_name?: string | null;
}

/**
 * The company ("organization") embedded in each job hit. Carries its own stable slug
 * (used to build canonical URLs + as the facet-filter key) and display name.
 */
export interface WttjOrganization {
  /** URL-safe company slug — the `{org.slug}` segment of the canonical detail URL. */
  slug?: string | null;
  /** Company display name (the real brand name — preferred over the de-slugified slug). */
  name?: string | null;
  /** Internal company reference id. */
  reference?: string | null;
}

/**
 * A single job as returned by the WTTJ Algolia index. Only the fields the adapter
 * consumes are modelled; all are optional and defensively narrowed.
 */
export interface WttjJobHit {
  /** Algolia object id — equals `reference` (the stable per-role guid). */
  objectID?: string | null;
  /** Stable per-role reference guid — the ATS id. */
  reference?: string | null;
  /** Job title. */
  name?: string | null;
  /** URL-safe per-role slug — the `{job.slug}` segment of the canonical detail URL. */
  slug?: string | null;
  /** Contract type token (e.g. `full_time`, `internship`, `apprenticeship`). */
  contract_type?: string | null;
  /** Structured workplace offices (city / state / country parts). */
  offices?: WttjOffice[] | null;
  /** Remote-work token (e.g. `no`, `fulltime`, `partial`, `punctual`). */
  remote?: string | null;
  /** Profession classification (category / sub-category / pivot labels). */
  new_profession?: WttjProfession | null;
  /** Short teaser / summary of the role (plain-ish text). */
  summary?: string | null;
  /** Candidate-profile section of the ad body (HTML-ish), when present. */
  profile?: string | null;
  /** Key-missions section of the ad body (HTML-ish), when present. */
  key_missions?: string | null;
  /** ISO publish timestamp (e.g. `2026-06-03T19:01:03Z`). */
  published_at?: string | null;
  /** Alternate publish date string, when present. */
  published_at_date?: string | null;
  /** Language of the listing (e.g. `fr`, `en`). */
  language?: string | null;
  /** Embedded company ("organization") object. */
  organization?: WttjOrganization | null;
}

/**
 * The Algolia query response envelope. Modelled defensively — the adapter narrows
 * `hits` to an array and reads the pagination counters when present.
 */
export interface WttjAlgoliaResponse {
  /** The page of job hits. */
  hits?: WttjJobHit[] | null;
  /** Total number of matching hits across all pages. */
  nbHits?: number | null;
  /** Total number of pages. */
  nbPages?: number | null;
  /** Zero-based current page index. */
  page?: number | null;
  /** Page size used. */
  hitsPerPage?: number | null;
}

/**
 * Normalised view of a single WTTJ role, ready to map to a JobPostDto.
 */
export interface WttjJob {
  /** Stable ATS id (the hit `reference`, falling back to `objectID`). */
  atsId: string;

  /** Absolute public detail URL (the canonical company-jobs detail page). */
  url: string;

  /** Absolute public apply URL. */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Company display name (the embedded brand name, falling back to the de-slugified slug). */
  companyName?: string | null;

  /** Structured location parts derived from the first office. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** HTML / text job-ad body (assembled from the available section fragments), when present. */
  descriptionHtml?: string | null;

  /** Department / profession label. */
  department?: string | null;

  /** Normalised employment-type label, when derivable. */
  employmentType?: string | null;

  /** Posted date — parsed from `published_at`, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}
