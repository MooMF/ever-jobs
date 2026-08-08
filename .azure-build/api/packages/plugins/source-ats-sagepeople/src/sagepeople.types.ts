/**
 * TypeScript interfaces for the Sage People (Fairsail) public Recruit careers surface.
 *
 * Sage People tenant applicant portals (`{tenant}.my.salesforce-sites.com/{path}/`) are
 * server-rendered Visualforce pages served by the Sage People Recruit managed package
 * (`fRecruit__` namespace). The open-roles board (`fRecruit__ApplyJobList`) embeds the
 * full open-roles set directly in the HTML as a table whose rows each link to a role's
 * detail / apply page (`fRecruit__ApplyJob?vacancyNo=VN…`). The adapter harvests those
 * anchors and the surrounding row cells. The interfaces below describe the normalised
 * internal shapes the adapter assembles from that HTML — there is no public JSON wire
 * shape, so everything is parsed defensively from the rendered markup and narrowed at
 * parse time, so cross-tenant or future-shape drift never breaks the parser.
 */

/**
 * A single role as harvested from the SSR `fRecruit__ApplyJobList` board: the anchor's
 * `vacancyNo`, its title text, its raw detail href, and the structured location parts
 * recovered from the role's table row. All fields beyond the id/href are best-effort and
 * defensively narrowed.
 */
export interface SagePeopleVacancy {
  /** The `vacancyNo` token (e.g. `VN4027`) — the stable per-role ATS id. */
  vacancyNo: string;

  /** Raw detail-page href harvested from the board anchor (relative or absolute). */
  href: string;

  /** Role display title (the anchor's inner text, tag-stripped). */
  title?: string | null;

  /**
   * The `portal` label carried on the anchor href, when present — preserved so the
   * canonical detail URL keeps the tenant's own portal context.
   */
  portal?: string | null;

  /** Office / city location recovered from the role's board row, when present. */
  city?: string | null;

  /** Work country recovered from the role's board row, when present. */
  country?: string | null;
}

/**
 * Normalised view of a single Sage People role, ready to map to a JobPostDto.
 */
export interface SagePeopleJob {
  /** Stable ATS id (the role `vacancyNo`). */
  atsId: string;

  /** Absolute public detail URL (the canonical `fRecruit__ApplyJob?vacancyNo=…` page). */
  url: string;

  /** Absolute public apply URL (the same detail page hosts the apply flow). */
  applyUrl: string;

  /** Job display title. */
  title?: string | null;

  /** Tenant company display name (the de-slugified tenant Salesforce-Site label). */
  companyName?: string | null;

  /** Structured location parts derived from the role's board row. */
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /** Combined free-text location, used for remote detection. */
  locationText?: string | null;

  /** Role description body (when a detail fetch supplies one), else null. */
  descriptionHtml?: string | null;

  /** Department / function label, when the board row exposes one. */
  department?: string | null;

  /** Posted date — Sage People boards do not expose one on the list page; null. */
  datePosted?: string | null;

  /** True when the role advertises remote / home-working. */
  isRemote?: boolean | null;
}

/**
 * Result of parsing one board page: the harvested role anchors plus the board's
 * server-side pagination total (so the adapter knows how many further pages to sweep).
 */
export interface SagePeopleBoardPage {
  /** The roles harvested from this board page. */
  vacancies: SagePeopleVacancy[];

  /** Total board page count parsed from the "Page N of M" marker (1 when absent). */
  totalPages: number;

  /** The site-path segment under which this board responded (`careers` / `recruit` / ``). */
  path: string;
}
