/**
 * TypeScript interfaces for the ReachMee (Talentech) public RSS vacancy export.
 *
 * The export (`GET /Public/rssfeed/external.ashx?id=…&InstallationID=…&CustomerName=…&lang=…`)
 * is an RSS 2.0 XML document, not JSON. We parse it into a small, defensive set
 * of plain objects. These interfaces describe the normalised in-memory shape
 * after parsing the `<channel>` and its `<item>` vacancies; field names mirror
 * the RSS element names (ReachMee uses custom, mixed-case elements such as
 * `Area1`, `occupationArea`, `CommAdSeqNo`), with a couple of `camelCase`
 * aliases modelled defensively so minor feed drift never breaks the parser.
 */

/** The resolved coordinates used to build the RSS export URL for an installation. */
export interface ReachMeeTarget {
  /** Numbered `site{NNN}` feed host label (e.g. `106`). */
  siteHost: string;
  /** Customer name query value (e.g. `oru`); may be empty for some public sites. */
  customerName: string;
  /** Installation id query value (e.g. `I003`). */
  installationId: string;
  /** Numeric site `id` query value (e.g. `12`). */
  siteId: string;
  /** Feed language (e.g. `UK`, `SE`). */
  lang: string;
}

/** A single vacancy parsed from one RSS `<item>` element. */
export interface ReachMeeVacancy {
  /** Plain `<title>` text (e.g. `"Doctoral students in Media and Communication Studies"`). */
  title?: string | null;

  /**
   * Stable vacancy id from `<CommAdSeqNo>` (e.g. `12743`), used as the ATS id.
   * Falls back to the `rmjob=` id mined from `<link>`.
   */
  commAdSeqNo?: string | null;

  /** Absolute public vacancy / apply URL from `<link>` (on a `web{NNN}.reachmee.com` host). */
  link?: string | null;
  url?: string | null;

  /** HTML-encoded job-ad body from `<description>` (entities decoded on parse). */
  description?: string | null;

  /** Primary area / city from `<Area1>` (e.g. `"Örebro"`). */
  area1?: string | null;
  /** Secondary area / region from `<Area2>` (e.g. `"Orebro"`). */
  area2?: string | null;
  /** Country name from `<country>` (e.g. `"Sweden"`). */
  country?: string | null;

  /** Occupation area / role family from `<occupationArea>` (e.g. `"Doctoral student"`). */
  occupationArea?: string | null;
  /** Specific position title from `<Position>` (e.g. `"Doktorand"`). */
  position?: string | null;

  /** Organisation-unit labels from `<Org1>` / `<Org2>` / `<Org3>` (department hierarchy). */
  org1?: string | null;
  org2?: string | null;
  org3?: string | null;

  /** Working-hours label from `<workingHours>` (e.g. `"Day"`). */
  workingHours?: string | null;
  /** Employment-level label from `<employmentLevel>` (e.g. `"Fixed-term position"`). */
  employmentLevel?: string | null;

  /** RFC-822 publish date from `<pubDate>` (e.g. `"Mon, 01 Jun 2026 23:59:00 +0200"`). */
  pubDate?: string | null;
  pubdate?: string | null;

  /** RFC-822 application deadline from `<pubDateTo>` (when present). */
  pubDateTo?: string | null;
}

/** Normalised RSS `<channel>` envelope returned after parsing the feed. */
export interface ReachMeeFeed {
  /** Channel `<title>` (e.g. "Available vacancies"). */
  title?: string | null;
  /** Parsed vacancies from the channel's `<item>` elements. */
  vacancies: ReachMeeVacancy[];
}
