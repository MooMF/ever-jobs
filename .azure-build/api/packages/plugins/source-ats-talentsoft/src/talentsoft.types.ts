/**
 * TypeScript interfaces for the Talentsoft public RSS offer export.
 *
 * The export (`GET /handlers/offerRss.ashx?LCID={lcid}`) is an RSS 2.0 XML
 * document, not JSON. We parse it into a small, defensive set of plain objects.
 * These interfaces describe the normalised in-memory shape after parsing the
 * `<channel>` and its `<item>` offers; field names mirror the RSS element names,
 * with a couple of `camelCase` aliases modelled defensively so minor feed drift
 * never breaks the parser.
 */

/** A single offer parsed from one RSS `<item>` element. */
export interface TalentsoftOffer {
  /**
   * Raw `<title>` text, typically `"{reference} - {job title}"`
   * (e.g. `"2025-15918 - Opérateur de production H/F"`).
   */
  title?: string | null;

  /**
   * Stable offer reference extracted from the title (e.g. `2025-15918`), used as
   * the ATS id. Falls back to the numeric offer id mined from `link`.
   */
  reference?: string | null;

  /** Display title with the leading reference token stripped, when present. */
  displayTitle?: string | null;

  /** Absolute public offer / apply URL from `<link>`. */
  link?: string | null;
  url?: string | null;

  /** HTML-encoded job-ad body from `<description>` (entities decoded on parse). */
  description?: string | null;

  /**
   * Free-text `<category>` labels attached to the offer. Talentsoft emits one or
   * more — typically a job-family path (e.g. `"Industrielle/Opérateur(trice)…"`)
   * plus a contract type (e.g. `"CDI"`, `"CDD"`, `"Stage"`, `"Alternance"`).
   */
  categories?: string[] | null;

  /** RFC-822 publish date from `<pubDate>` (e.g. `"Wed, 03 Jun 2026 15:10:39 Z"`). */
  pubDate?: string | null;
  pubdate?: string | null;

  /** Optional `<guid>` when a tenant feed emits one (most do not). */
  guid?: string | null;
}

/** Normalised RSS `<channel>` envelope returned after parsing the feed. */
export interface TalentsoftFeed {
  /** Channel `<title>` (e.g. "Export RSS des offres …"). */
  title?: string | null;
  /** Channel `<language>` (e.g. "fr-FR"). */
  language?: string | null;
  /** Parsed offers from the channel's `<item>` elements. */
  offers: TalentsoftOffer[];
}
