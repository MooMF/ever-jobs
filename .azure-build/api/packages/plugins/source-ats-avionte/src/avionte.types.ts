/**
 * TypeScript interfaces for the Avionté (AviontéBOLD) public RSS/XML job feed.
 *
 * The export (`GET /buildjobs_rss.aspx?compid={buildId}[&format=xml]`) is an
 * RSS 2.0 / XML document, not JSON. We parse it into a small, defensive set of
 * plain objects. These interfaces describe the normalised in-memory shape after
 * parsing the `<channel>` and its `<item>` jobs; field names mirror the RSS /
 * XML element names, with a couple of `camelCase` aliases modelled defensively
 * so minor feed drift never breaks the parser.
 */

/** A single job parsed from one RSS/XML `<item>` element. */
export interface AvionteJob {
  /** Raw `<title>` text — the job title (extended feeds may append a location). */
  title?: string | null;

  /**
   * Stable per-job id. Avionté emits it as `<guid>` (or an extended-XML id /
   * `<jobid>` element); we fall back to the id mined from `<link>` when absent.
   */
  id?: string | null;
  guid?: string | null;

  /** Absolute public job / apply URL from `<link>`. */
  link?: string | null;
  url?: string | null;

  /**
   * Job-ad body from `<description>` (HTML in the extended XML variant, entities
   * decoded on parse). Absent in the base RSS feed, which carries no body.
   */
  description?: string | null;

  /**
   * Free-text location label. The base RSS feed exposes it as a `<location>` /
   * `<joblocation>` element (or inside the body); the extended XML variant adds
   * structured `<city>` / `<state>` fields when present.
   */
  location?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;

  /**
   * Job category label from `<category>` (e.g. a job-family / industry tag),
   * surfaced as the department when present.
   */
  category?: string | null;

  /** Employment type from the extended XML (e.g. `Full-Time`, `Contract`). */
  employmentType?: string | null;
  employmenttype?: string | null;

  /** RFC-822 / ISO publish date from `<pubDate>` (extended feeds). */
  pubDate?: string | null;
  pubdate?: string | null;
}

/** Normalised RSS/XML `<channel>` envelope returned after parsing the feed. */
export interface AvionteFeed {
  /** Channel `<title>` (typically the build / company name). */
  title?: string | null;
  /** Channel `<link>` (the build's public careers page). */
  link?: string | null;
  /** Parsed jobs from the channel's `<item>` elements. */
  jobs: AvionteJob[];
}
