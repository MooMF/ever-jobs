/**
 * Constants for the Connexys applicant-tracking careers platform.
 *
 * Connexys (connexys.com — a Dutch recruitment / ATS vendor, now part of Bullhorn as
 * "Bullhorn Connexys" and delivered natively on the Salesforce platform) lets every customer
 * tenant publish its open roles to a branded, public, candidate-facing career site, and — for
 * each such publication channel — exposes a **public, unauthenticated XML vacancy feed** that
 * career websites and aggregators consume directly. The feed is the tenant's own documented
 * machine surface: it always reflects the currently-published vacancies and carries every field
 * a downstream site renders, so the adapter consumes it rather than scraping a client-rendered
 * career page or depending on any authenticated tenant API.
 *
 * The feed is addressed on the Connexys-hosted career host by a per-tenant **site name** (the
 * tenant's career-site label) plus an optional **publication-channel id** that scopes the feed
 * to one publication target:
 *
 *   GET https://www.connexys.nl/{site}public/run/xml_feed.startup?p_pub_id={channelId}
 *     → <?xml version="1.0" encoding="UTF-8"?>
 *       <vacancies>
 *         <vacancy id="123456">
 *           <titel>Financieel Controller</titel>          // job title
 *           <plaats>Rotterdam</plaats>                    // city / place
 *           <regio>Zuid-Holland</regio>                   // region / state
 *           <land>Nederland</land>                        // country
 *           <omschrijving><![CDATA[ …HTML body… ]]></omschrijving>   // description
 *           <functiegroep>Finance</functiegroep>          // function group ≈ department
 *           <dienstverband>Fulltime</dienstverband>       // employment type
 *           <uren>40</uren>                               // hours per week
 *           <publicatiedatum>2026-05-12</publicatiedatum> // publish date
 *           <url>https://www.example.nl/jobs/job/financieel-controller/rotterdam/123456</url>
 *           <sollicitatie_url>…</sollicitatie_url>        // apply URL (when distinct)
 *           <publicatie_id>20</publicatie_id>             // publication-channel id
 *         </vacancy>
 *         …
 *       </vacancies>
 *
 * The feed returns every currently-published role for the channel in one response (no
 * server-side pagination), so the adapter fetches once and slices client-side to honour
 * `resultsWanted`. The candidate-facing detail / apply page lives at the canonical per-vacancy
 * `<url>` (a tenant-hosted `…/jobs/job/{title-slug}/{city-slug}/{id}` link); the apply form is
 * the `<sollicitatie_url>` when distinct, else the detail URL itself.
 *
 * The caller addresses a tenant by `companySlug` (the Connexys site name, optionally suffixed
 * with `#{channelId}` to pin a publication channel) or by `companyUrl` (a Connexys career-host
 * feed / site URL from which the site name + channel id are recovered). An unknown site, an
 * empty channel, or a malformed payload degrades to an empty / partial result rather than
 * throwing, so a single bad tenant never breaks a batch run. A transport-level failure (host
 * unreachable) stops the sweep; an HTTP error status degrades to no roles.
 *
 * Surface confidence (researched 2026-06-04, no authentication):
 *  - Confirmed Connexys's documented public surface is the per-tenant XML vacancy feed at
 *    `…/{site}public/run/xml_feed.startup?p_pub_id={id}` (Connexys's own published
 *    web-administrator XML vacancy-interface contract), and that the feed lists every
 *    currently-published vacancy for a channel with `titel` / `plaats` / `omschrijving` /
 *    `publicatiedatum` / `url` fields — the same data a tenant career site renders.
 *  - Connexys is mid-migration to the Salesforce platform; the legacy `www.connexys.nl`
 *    career host did not return a live feed body for the sample tenant probed this run (the
 *    host answered an HTTP error for the legacy path), so a live anonymous body could not be
 *    re-confirmed end-to-end. The URL contract + field names below follow Connexys's documented
 *    public vacancy-feed interface and are modelled defensively (every field optional, multiple
 *    tag aliases) so the parser degrades gracefully across tenants and platform generations.
 *    verified=false.
 */

/** Root domain — used to recognise Connexys career / feed URLs passed via `companyUrl`. */
export const CONNEXYS_ROOT_DOMAIN = 'connexys.nl';

/**
 * Canonical public career / feed host. Connexys serves each tenant's public vacancy feed from
 * the shared career host under a per-tenant `{site}public/run/...` path.
 */
export const CONNEXYS_FEED_HOST = 'https://www.connexys.nl';

/**
 * Path template (relative to the feed host) for the public, unauthenticated XML vacancy feed.
 * `{site}` is the tenant's Connexys site name; the `public/run/xml_feed.startup` program emits
 * the channel's currently-published vacancies as XML.
 */
export const CONNEXYS_FEED_PATH_TEMPLATE = '/{site}public/run/xml_feed.startup';

/**
 * Query-parameter name that scopes the feed to a single publication-channel id (`p_pub_id`).
 * Omitting it returns the site's default/aggregate channel.
 */
export const CONNEXYS_PUB_ID_PARAM = 'p_pub_id';

/**
 * Builds the public XML vacancy-feed URL for a tenant site name and optional channel id.
 * A non-empty `channelId` is appended as `?p_pub_id={channelId}`.
 */
export const connexysFeedUrl = (site: string, channelId?: string | null): string => {
  const path = CONNEXYS_FEED_PATH_TEMPLATE.replace('{site}', encodeURIComponent(site));
  const base = `${CONNEXYS_FEED_HOST}${path}`;
  if (channelId && channelId.trim()) {
    const params = new URLSearchParams({ [CONNEXYS_PUB_ID_PARAM]: channelId.trim() });
    return `${base}?${params.toString()}`;
  }
  return base;
};

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO default is
 * small, but when a caller omits `resultsWanted` entirely we ingest up to 100 of the tenant's
 * currently-published roles.
 */
export const CONNEXYS_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on feed documents fetched per scrape. The feed returns a channel's full role
 * set in one document, so the adapter normally fetches a single document; the cap guards the
 * defensive multi-channel path against an unbounded fan-out.
 */
export const CONNEXYS_MAX_PAGES = 25;

/**
 * Upper bound (seconds) on the per-request HTTP timeout. An unresponsive career host can
 * connect-then-hang, so we cap the shared client's 60s default to keep graceful-degradation
 * well inside callers' budgets; a healthy tenant responds quickly. A caller may request a
 * SHORTER timeout — we only bound the upper end.
 */
export const CONNEXYS_DEFAULT_TIMEOUT_SECONDS = 15;

/** Default request headers. The feed expects a browser-like UA and an XML accept. */
export const CONNEXYS_HEADERS: Record<string, string> = {
  Accept: 'application/xml, text/xml, */*',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9,nl;q=0.8',
};

/**
 * Matches each top-level `<vacancy …>…</vacancy>` block in the feed, capturing its attribute
 * string (group 1) and inner body (group 2). Case-insensitive and tolerant of attribute order.
 */
export const CONNEXYS_VACANCY_REGEX = /<vacancy\b([^>]*)>([\s\S]*?)<\/vacancy>/gi;

/**
 * Detects remote / home-working roles across the title, location, and function-group fields,
 * complementing any structured signal the feed emits. Covers Dutch and English phrasings.
 */
export const CONNEXYS_REMOTE_REGEX =
  /\b(remote|thuiswerk(?:en)?|hybride|hybrid|home[\s-]?office|telewerk|telecommute|work\s*from\s*home|wfh|anywhere)\b/i;
