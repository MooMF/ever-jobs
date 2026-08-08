/**
 * Constants for the Carerix recruitment platform.
 *
 * Carerix (carerix.com, Netherlands) is a recruitment-software vendor (ATS + CRM)
 * widely used by Dutch / Benelux staffing agencies, secondment bureaus, and
 * corporate recruitment teams. Every customer ("application") is provisioned on its
 * own sub-domain of the shared host `https://{tenant}.carerix.com/`, where the
 * `{tenant}` label is the Carerix application name. Each tenant publishes its open
 * vacancies through Carerix's bundled **CxTools** toolset, which serves public,
 * unauthenticated, server-rendered XML job feeds under `/cxtools/`:
 *
 *   GET https://{tenant}.carerix.com/cxtools/jobboardFeed.php?start=0&count=300[&medium={code}]
 *     → a generic job-board XML feed listing every published vacancy.
 *
 *   GET https://{tenant}.carerix.com/cxtools/indeedFeed.php
 *     → the same vacancies in Indeed's well-documented `<source><job>…</job></source>`
 *       XML schema (title, referencenumber, url, company, city, state, country,
 *       date, jobtype, description). This is the most uniformly structured feed and
 *       is used as the primary parse surface; the generic job-board feed is a
 *       defensive fallback.
 *
 *   GET https://{tenant}.carerix.com/cxtools/RSSx.php
 *     → an RSS 2.0 / J4P "extended" feed of the same vacancies (used as a last
 *       fallback when the Indeed/job-board feeds are unavailable for a tenant).
 *
 * Each vacancy carries a stable Carerix `publicationID` (surfaced in the feed as the
 * Indeed `<referencenumber>` and/or embedded in the publication's detail / apply
 * URL, e.g. `…/vacature-{publicationID}` or `…?pub_id={publicationID}`). The
 * `publicationID` is the stable ATS id; the publication's own `<url>` (when present)
 * is the canonical candidate-facing detail / apply URL, otherwise it is rebuilt from
 * the tenant host + publication id.
 *
 * The caller addresses a tenant by `companySlug` (the Carerix application name, e.g.
 * `acme`) or by `companyUrl` (any URL on a `carerix.com` host whose sub-domain
 * encodes the tenant). A tenant with the feed disabled / no published vacancies
 * returns an empty feed (or HTTP 404), so it degrades naturally to an empty result.
 * A fetch error, an HTTP 4xx, a DNS failure, or a malformed body degrades to an
 * empty / partial result rather than throwing, so a single bad tenant never breaks a
 * batch run.
 *
 * Surface confidence (researched 2026-06-03, no authentication; verified=false):
 *  - Confirmed the platform + tenant addressing scheme via Carerix's own technical
 *    documentation: customers are provisioned on `{tenant}.carerix.com`, and the
 *    public CxTools feeds live under `/cxtools/` —
 *    `jobboardFeed.php?start=0&count=300&medium={code}`,
 *    `indeedFeed.php`, `TrovitFeed.php`, and the RSS-extended `RSSx.php`
 *    (Carerix Help Center: "CxTools", "RSS", "Publish Job orders on job sites").
 *  - Confirmed the stable per-vacancy identifier is the Carerix `publicationID`,
 *    used to construct candidate-facing detail / apply URLs (Carerix Help Center:
 *    "ApplyURL"). A specific live tenant feed could not be fetched during research
 *    (the generic `jobboardFeed`/RSS feeds require a per-tenant XML password to be
 *    enabled, and the demo sub-domain presented a TLS host mismatch), so the parser
 *    is written defensively against the documented feed shapes (verified=false).
 */

/** Root domain — used to recognise tenant hosts/URLs passed via `companyUrl`. */
export const CARERIX_ROOT_DOMAIN = 'carerix.com';

/**
 * Builds the shared per-tenant CxTools host origin for a resolved tenant slug
 * (the Carerix application name), e.g. `https://acme.carerix.com`.
 */
export const CARERIX_HOST_TEMPLATE = (tenant: string): string =>
  `https://${tenant}.${CARERIX_ROOT_DOMAIN}`;

/** Public CxTools directory under which every tenant's job feeds are served. */
export const CARERIX_CXTOOLS_PATH = '/cxtools';

/**
 * Primary public feed path — Carerix's Indeed XML feed. It carries every published
 * vacancy in Indeed's stable `<source><job>…</job></source>` schema, which is the
 * most uniformly structured of the CxTools feeds.
 */
export const CARERIX_INDEED_FEED_PATH = '/cxtools/indeedFeed.php';

/**
 * Fallback public feed path — the generic CxTools job-board XML feed. Supports
 * `start`, `count`, and an optional `medium` (job-board medium code) query.
 */
export const CARERIX_JOBBOARD_FEED_PATH = '/cxtools/jobboardFeed.php';

/** Last-resort public feed path — the RSS-extended (J4P) feed of the same vacancies. */
export const CARERIX_RSS_FEED_PATH = '/cxtools/RSSx.php';

/**
 * Ordered list of candidate public feed paths the adapter probes for a tenant. The
 * first feed that returns a non-empty, parseable body wins; the rest are fallbacks.
 */
export const CARERIX_FEED_PATHS: readonly string[] = [
  CARERIX_INDEED_FEED_PATH,
  CARERIX_JOBBOARD_FEED_PATH,
  CARERIX_RSS_FEED_PATH,
];

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest up
 * to 100 of the tenant's published vacancies.
 */
export const CARERIX_DEFAULT_RESULTS = 100;

/**
 * Page size requested from the generic job-board feed (`count`) and the hard ceiling
 * on the number of feed pages fetched per scrape. The Indeed / RSS feeds render the
 * full board in one document; the job-board feed is paged with `start`/`count`, so
 * the page cap guards against an unbounded walk.
 */
export const CARERIX_PAGE_SIZE = 300;
export const CARERIX_MAX_PAGES = 50;

/** Default request headers. The feeds expect a browser-like UA + XML/RSS Accept. */
export const CARERIX_HEADERS: Record<string, string> = {
  Accept: 'application/xml,text/xml,application/rss+xml,application/atom+xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
};

/**
 * Matches a single `<job>…</job>` block in the Indeed-schema feed (case-insensitive,
 * dot-matches-newline applied at call site via the `s` flag).
 */
export const CARERIX_INDEED_JOB_REGEX = /<job\b[^>]*>([\s\S]*?)<\/job>/gi;

/**
 * Matches a single `<item>…</item>` block in the RSS / J4P feed (the RSS fallback).
 */
export const CARERIX_RSS_ITEM_REGEX = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;

/**
 * Extracts a Carerix `publicationID` from a publication detail / apply URL when it is
 * not carried as its own feed field. Covers the documented URL shapes:
 *   …/vacature-{publicationID}        (SRSx websites)
 *   …?pub_id={publicationID}          (WordPress plugin)
 *   …/joborder/{publicationID}/…      (custom-website API)
 */
export const CARERIX_PUBLICATION_ID_REGEX =
  /(?:[?&]pub_id=|\/vacature-|\/joborder\/)(\d{2,})/i;

/** Detects remote / home-working roles across the title, location, and type fields. */
export const CARERIX_REMOTE_REGEX =
  /\b(remote|thuiswerk(?:en)?|hybride|hybrid|home[\s-]?(?:based|working|office)|work\s*from\s*home|wfh|telecommute|telewerk(?:en)?)\b/i;
