/**
 * Constants for the Talentsoft (Cegid Talentsoft) applicant-tracking careers
 * platform.
 *
 * Talentsoft (talentsoft.com / talent-soft.com, France — now part of Cegid) is
 * an EU enterprise ATS used by large French and European organisations. Every
 * customer tenant publishes a branded, public career site on its own
 * sub-domain of `talent-soft.com`:
 *
 *   https://{tenant}-recrute.talent-soft.com/        (most common — FR "recrute")
 *   https://{tenant}-career.talent-soft.com/         (EN "career" variant)
 *   https://{tenant}careers.talent-soft.com/         (no-separator variant)
 *
 * The site's structured, machine-readable open-roles surface is the per-tenant
 * RSS export handler, which is public and unauthenticated:
 *
 *   GET https://{host}/handlers/offerRss.ashx?LCID={lcid}
 *     → application/rss+xml, e.g.
 *       <rss><channel>
 *         <title>Export RSS des offres …</title>
 *         <language>fr-FR</language>
 *         <item>
 *           <title>2025-15918 - Opérateur de production H/F</title>
 *           <link>https://…/r/15918/502/1036?reference=2025-15918</link>
 *           <category>Industrielle/Opérateur(trice) de production</category>
 *           <category>CDI</category>
 *           <description>&lt;b&gt;…HTML-encoded job body…&lt;/b&gt;</description>
 *           <pubDate>Wed, 03 Jun 2026 15:10:39 Z</pubDate>
 *         </item>
 *         …
 *       </channel></rss>
 *
 * The RSS export returns every published offer for the tenant in one response
 * (no server-side pagination), so we fetch once and slice client-side to honour
 * `resultsWanted`. The reference number embedded in each item's title (e.g.
 * `2025-15918`) — falling back to the numeric offer id in the `link` — is the
 * stable per-offer ATS id. Items carry one or more `<category>` labels (job
 * family + contract type) which we map to department / employment type.
 *
 * NOTE on the official APIs: Talentsoft also ships first-class JSON streaming
 * APIs (vacancies / candidates) on the Cegid HR developer portal, but those are
 * OAuth2 client-credentials gated and therefore unsuitable for a generic,
 * tenant-agnostic, unauthenticated scraper. The public RSS export is the
 * documented, no-auth surface used here.
 *
 * The caller addresses a tenant by `companySlug` (the sub-domain label, e.g.
 * `elis`) or by a full `companyUrl` (any page on the tenant career host, whose
 * host is used verbatim). An unknown sub-domain (HTTP 404 / other 4xx), a
 * network error, or a malformed / non-XML payload degrades to an empty
 * (graceful) result rather than throwing, so a single bad tenant never breaks a
 * batch run.
 *
 * Verified live 2026-06-03 (no authentication):
 *  - `https://elis-recrute.talent-soft.com/offre-de-emploi/tous-les-flux-rss.aspx`
 *    advertises the all-offers feed `/handlers/offerRss.ashx?LCID=1036`.
 *  - `GET https://elis-recrute.talent-soft.com/handlers/offerRss.ashx?LCID=1036`
 *    → HTTP 200 RSS XML with ~326 `<item>` offers (Elis), each with title
 *    `"2025-15918 - Opérateur de production H/F"`, an absolute `<link>`,
 *    HTML-encoded `<description>`, `<category>` labels and an RFC-822 `<pubDate>`.
 *  - Sibling tenants confirmed on the same `{tenant}-recrute.talent-soft.com`
 *    host pattern: `seloger`, `matmut`, `apave`, `groupeadp`, `macsf`.
 */

/** Career-host template for a tenant addressed by sub-domain slug (FR "recrute"). */
export const TALENTSOFT_CAREERS_HOST_TEMPLATE = 'https://{tenant}-recrute.talent-soft.com';

/** Root career domain — used to recognise tenant hosts passed via `companyUrl`. */
export const TALENTSOFT_ROOT_DOMAIN = 'talent-soft.com';

/**
 * Public, unauthenticated RSS export handler path. Returns every published
 * offer for the tenant in one response.
 */
export const TALENTSOFT_RSS_PATH = '/handlers/offerRss.ashx';

/**
 * Default locale id for the RSS export. `1036` is French (fr-FR), the platform's
 * primary market; `2057` is en-GB and `1033` en-US. Most tenant feeds accept any
 * configured LCID and fall back to their default locale for unknown values.
 */
export const TALENTSOFT_DEFAULT_LCID = 1036;

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the tenant's open roles.
 */
export const TALENTSOFT_DEFAULT_RESULTS = 100;

/** Default request headers. The feed expects a browser-like UA + XML/RSS accept. */
export const TALENTSOFT_HEADERS: Record<string, string> = {
  Accept: 'application/rss+xml, application/xml, text/xml, */*',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
};

/**
 * Matches a single RSS `<item>…</item>` block (case-insensitive, dot-all). Used
 * to split the feed into per-offer chunks before extracting fields.
 */
export const TALENTSOFT_ITEM_REGEX = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;

/**
 * Extracts the inner text of a named child element, tolerating CDATA wrappers
 * and attributes. `{tag}` is substituted at build time per element.
 */
export const TALENTSOFT_TAG_REGEX_TEMPLATE = '<{tag}\\b[^>]*>([\\s\\S]*?)<\\/{tag}>';

/**
 * Captures the leading reference token of an offer title (e.g. `2025-15918`),
 * which Talentsoft uses as the stable, human-visible offer reference / ATS id.
 */
export const TALENTSOFT_REFERENCE_REGEX = /^\s*([0-9]{2,4}-[0-9A-Za-z]+)\s*[-–—:]\s*/;

/**
 * Captures the numeric offer id from a canonical offer `link`
 * (e.g. `…/r/15918/502/1036?reference=…` or `…_15918.aspx`). Used as a fallback
 * ATS id when the title carries no reference token.
 */
export const TALENTSOFT_LINK_ID_REGEX = /(?:\/r\/|_)(\d{3,})(?:[/_.?]|$)/;

/** Detects remote / work-from-home roles across FR + EN phrasings. */
export const TALENTSOFT_REMOTE_REGEX =
  /\b(remote|t[ée]l[ée]travail|home\s*office|work\s*from\s*home|wfh|à\s*distance)\b/i;
