/**
 * TypeScript interfaces for the Sólides (solides.com.br) public careers surface.
 *
 * Sólides tenant career sites (`{tenant}.vagas.solides.com.br`) are client-rendered
 * Next.js SPAs whose open roles are fetched after hydration from the platform's public,
 * unauthenticated JSON API gateway:
 *
 *   GET https://apigw.solides.com.br/jobs/v3/home/vacancy?slug={tenant}&take=&page=
 *     → { success, errors, data: { count, currentPage, totalPages, data: [ vacancy ] } }
 *
 * The interfaces below describe the subset of the vacancy wire shape the adapter reads
 * plus the normalised internal role assembled from it. Everything the adapter reads is
 * optional and defensively narrowed at parse time, so cross-tenant or future-shape
 * drift never breaks the parser.
 */

/** A `{ id, name, code? }` reference object (state / seniority / contract-type / area). */
export interface SolidesNamedRef {
  /** Numeric reference id. */
  id?: number | string | null;
  /** Human-readable label. */
  name?: string | null;
  /** Short code (e.g. a state code `SP`), when present. */
  code?: string | null;
  /** Level marker, when present (unused by the adapter). */
  level?: string | null;
}

/** A `{ id, name, state_id }` city reference embedded in a vacancy. */
export interface SolidesCity {
  id?: number | string | null;
  name?: string | null;
  state_id?: number | string | null;
}

/** A `{ id, name, code }` state reference embedded in a vacancy. */
export interface SolidesState {
  id?: number | string | null;
  name?: string | null;
  code?: string | null;
}

/** A structured address block embedded in a vacancy, when present. */
export interface SolidesAddress {
  neighborhood?: string | null;
  street_address?: string | null;
  city?: SolidesCity | null;
  state?: SolidesState | null;
  country?: SolidesNamedRef | null;
  zip_code?: string | null;
}

/**
 * A single vacancy as returned in the listing payload's `data.data[]` array. Only the
 * fields the adapter consumes are modelled; all are optional and defensively narrowed.
 */
export interface SolidesVacancy {
  /** Numeric vacancy id — the stable ATS id and the `/vaga/{id}` URL segment. */
  id?: number | string | null;
  /** Job display title. */
  title?: string | null;
  /** HTML job-ad body (the rich description). */
  description?: string | null;
  /** Workflow state (e.g. `em_andamento`); informational only. */
  currentState?: string | null;
  /** Company reference id (internal). */
  referenceId?: number | string | null;
  /** Display company name (e.g. `Sólides Tecnologia`). */
  companyName?: string | null;
  /** Absolute company-logo URL. */
  companyLogo?: string | null;
  /** State reference (top-level convenience copy). */
  state?: SolidesState | null;
  /** City reference (top-level convenience copy). */
  city?: SolidesCity | null;
  /** Structured address block. */
  address?: SolidesAddress | null;
  /** Tenant slug echoed back by the API. */
  slug?: string | null;
  /** Optional external redirect / apply link (when the role is hosted externally). */
  redirectLink?: string | null;
  /** Listing type (e.g. `externa`, `interna`). */
  type?: string | null;
  /** True when the role is a hidden / unlisted job. */
  isHiddenJob?: boolean | null;
  /** True when the role is fully home-office. */
  homeOffice?: boolean | null;
  /** Work-modality token (e.g. `remoto`, `presencial`, `hibrido`). */
  jobType?: string | null;
  /** Number of open positions. */
  openPositions?: number | string | null;
  /** Seniority references (e.g. `Junior`). */
  seniority?: SolidesNamedRef[] | null;
  /** Recruitment contract-type references (e.g. `CLT`) — the employment type. */
  recruitmentContractType?: SolidesNamedRef[] | null;
  /** Occupation-area references (e.g. `Recursos Humanos`) — the department. */
  occupationAreas?: SolidesNamedRef[] | null;
  /** ISO publish date (e.g. `2026-06-01`). */
  createdAt?: string | null;
}

/** The paginated listing envelope: `data.data[]` is the vacancy array. */
export interface SolidesVacancyPage {
  /** Total open-role count for the tenant. */
  count?: number | null;
  /** 1-based current page index. */
  currentPage?: number | null;
  /** Total number of pages at the requested page size. */
  totalPages?: number | null;
  /** The vacancies on this page. */
  data?: SolidesVacancy[] | null;
}

/** The top-level API response envelope wrapping a vacancy page. */
export interface SolidesVacancyResponse {
  /** API success flag. */
  success?: boolean | null;
  /** API error list (empty on success). */
  errors?: unknown[] | null;
  /** The paginated vacancy page. */
  data?: SolidesVacancyPage | null;
}

/**
 * Normalised view of a single Sólides role, ready to map to a JobPostDto.
 */
export interface SolidesJob {
  /** Stable ATS id (the vacancy numeric `id`, as text). */
  atsId: string;

  /** Absolute public detail URL (the canonical career-site job page). */
  url: string;

  /** Absolute public apply URL (the external `redirectLink`, else the detail URL). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Company display name (from `companyName`, else derived from the slug). */
  companyName?: string | null;

  /** Structured location parts derived from the vacancy's city / state / address. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Raw single-line location string, used for remote detection. */
  locationText?: string | null;

  /** HTML job-ad body (the richest description available), when present. */
  descriptionHtml?: string | null;

  /** Department / occupation-area label. */
  department?: string | null;

  /** Employment / contract-type label (e.g. `CLT`). */
  employmentType?: string | null;

  /** Posted date — parsed from `createdAt`, when available. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-office. */
  isRemote?: boolean | null;
}
