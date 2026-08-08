/**
 * TypeScript interfaces for the Paycor Recruiting (Newton Software) public career
 * portal.
 *
 * The portal is server-rendered HTML, not JSON, so we parse it into a small,
 * defensive set of plain objects. These interfaces describe the normalised in-memory
 * shape after parsing the career-home listing and each role's `JobIntroduction.action`
 * detail page. Every field is optional / nullable because tenant portals vary in
 * which labels they render.
 */

/**
 * A single open-role link mined from the career-home listing. The opaque hex `id` is
 * the stable per-role ATS id; `title` is the anchor's inner text.
 */
export interface PaycorJobLink {
  /** Opaque hex role id from the anchor's `JobIntroduction.action?…&id=` param. */
  id: string;
  /** Absolute (or absolutised) `JobIntroduction.action` detail URL. */
  url: string;
  /** Anchor inner text — the job title as shown on the listing. */
  title?: string | null;
}

/** A role parsed from one `JobIntroduction.action` detail page. */
export interface PaycorJob {
  /** Opaque hex role id (ATS id), echoed from the listing link. */
  id: string;
  /** Public detail / role URL. */
  url: string;
  /** Resolved job title (detail `og:title` / `<title>` / listing anchor text). */
  title?: string | null;
  /** Company / organisation name (derived; tenants rarely render it inline). */
  companyName?: string | null;
  /** Job-body HTML mined from the detail page's description container, when present. */
  descriptionHtml?: string | null;
  /** Plain-text body summary mined from `og:description` / meta description. */
  description?: string | null;
  /** Free-text location city ("{City}" of a "{City}, {Region}" line). */
  city?: string | null;
  /** Free-text location region / state / country ("{Region}" segment). */
  region?: string | null;
  /** Department label when the detail page renders one. */
  department?: string | null;
  /** Employment-type / job-type label when present. */
  employmentType?: string | null;
  /** Whether the role appears to be remote (detected across title/location/body). */
  isRemote?: boolean;
}
