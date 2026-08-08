/**
 * Constants for the Avionté (AviontéBOLD) applicant-tracking / staffing careers
 * platform.
 *
 * Avionté (avionte.com, US) is a staffing & recruiting ATS. Every customer
 * ("build") publishes its posted jobs through a public, unauthenticated job
 * feed that powers its branded careers page. Avionté ships two documented
 * public surfaces for the same job set, and a custom careers page may be wired
 * to either:
 *
 *   1. RSS / XML feed (used here — primary surface):
 *        GET https://www.myavionte.com/buildjobs_rss.aspx?compid={buildId}
 *        GET https://www.myavionte.com/buildjobs_rss.aspx?compid={buildId}&format=xml
 *      → an RSS 2.0 document of every posted job for the build. The base feed
 *        carries Job Category, Job Title, Job Location and the public Job URL
 *        per `<item>`; appending `&format=xml` returns a richer, non-RSS XML
 *        variant with additional fields (description, posted date, employment
 *        type, id). There is no server-side pagination — every posted job is
 *        returned in one response, so we fetch once and slice client-side to
 *        honour `resultsWanted`.
 *
 *   2. JSON Jobs feed (documented, but per-build API-key gated):
 *        GET https://www.myavionte.com/staff/jsonjobsv3.aspx?ID={apiKey}
 *      → the same job set in JSON. The `ID` is a per-build API key issued from
 *        the build's Careers Page / Job Board editor, so this surface is *not*
 *        tenant-agnostic without a credential and is therefore a non-goal here.
 *
 * Tenants also host a branded portal on `{slug}.aviontego.com` (e.g. the
 * AviontéBOLD "Careers" portal / `/portals/Portals/JobBoard/JobSearch.aspx`),
 * but that listing is a server-rendered ASP.NET search form whose results load
 * via postback — it carries no static schema.org JobPosting JSON-LD — so the
 * RSS/XML build feed is the structured, machine-readable surface we target.
 *
 * The caller addresses a build by `companySlug` (used as the `compid` build id,
 * e.g. a known build identifier) or by a full `companyUrl` (a
 * `buildjobs_rss.aspx?compid=…` feed URL, or any `*.aviontego.com` portal URL /
 * `?CompanyID=` query from which the build id is recovered). An unknown build,
 * a network error, or a malformed / non-XML payload degrades to an empty
 * (graceful) result rather than throwing, so a single bad tenant never breaks a
 * batch run.
 *
 * NOTE on verification (2026-06-03): the public feed host and path are
 * documented by Avionté ("The RSS feed URL will always start with
 * https://www.myavionte.com/buildjobs_rss.aspx and end with a unique ID for
 * your build"; "&format=xml" yields the extended XML). `GET buildjobs_rss.aspx`
 * with no `compid` returns a .NET null-reference error (confirming the endpoint
 * exists and requires the build id). Real AviontéBOLD tenants confirmed live on
 * the sibling `*.aviontego.com` portal host include `mdr` (Meador Staffing
 * Services), `crs` (Career Strategies Inc) and `gsf` (Go-Staff, Inc). A
 * specific public build id could not be enumerated without a tenant's editor
 * access, so the field-level wire shape is taken from Avionté's published feed
 * documentation and the parser is written defensively; verified=false.
 */

/**
 * Public RSS/XML job-feed origin. The full feed is
 * `${AVIONTE_FEED_ORIGIN}${AVIONTE_RSS_PATH}?compid={buildId}`.
 */
export const AVIONTE_FEED_ORIGIN = 'https://www.myavionte.com';

/** Root feed domain — used to recognise feed URLs passed via `companyUrl`. */
export const AVIONTE_FEED_DOMAIN = 'myavionte.com';

/**
 * Branded tenant portal domain (`{slug}.aviontego.com`). Recognised in
 * `companyUrl` so a portal URL / `?CompanyID=` query can be mapped to a build.
 */
export const AVIONTE_PORTAL_DOMAIN = 'aviontego.com';

/**
 * Public, unauthenticated RSS export path. Returns every posted job for the
 * build in one response. Appending `&format=xml` yields the richer XML variant.
 */
export const AVIONTE_RSS_PATH = '/buildjobs_rss.aspx';

/**
 * Query string appended to the feed URL to request the extended (non-RSS)
 * XML variant, which carries the additional per-job fields (description,
 * posted date, employment type, id) beyond the base RSS title/location/link.
 */
export const AVIONTE_XML_FORMAT_QUERY = 'format=xml';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public
 * DTO default is small, but when a caller omits `resultsWanted` entirely we
 * ingest up to 100 of the build's posted jobs.
 */
export const AVIONTE_DEFAULT_RESULTS = 100;

/** Default request headers. The feed expects a browser-like UA + XML/RSS accept. */
export const AVIONTE_HEADERS: Record<string, string> = {
  Accept: 'application/rss+xml, application/xml, text/xml, */*',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Matches a single RSS `<item>…</item>` block (case-insensitive, dot-all). Used
 * to split the feed into per-job chunks before extracting fields.
 */
export const AVIONTE_ITEM_REGEX = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;

/**
 * Extracts the inner text of a named child element, tolerating CDATA wrappers
 * and attributes. `{tag}` is substituted at build time per element.
 */
export const AVIONTE_TAG_REGEX_TEMPLATE = '<{tag}\\b[^>]*>([\\s\\S]*?)<\\/{tag}>';

/**
 * Captures the build id from a feed URL (`…buildjobs_rss.aspx?compid={id}`) or a
 * portal URL (`…?CompanyID={id}`). Both query names appear case-insensitively.
 */
export const AVIONTE_COMPID_REGEX = /[?&](?:compid|companyid)=([^&#]+)/i;

/**
 * Captures the numeric / token job id from a public Avionté job URL
 * (e.g. `…?JobId=12345`, `…&postid=12345`, or a trailing `/jobs/12345`). Used as
 * a fallback ATS id when an item carries no explicit `<guid>` / id element.
 */
export const AVIONTE_JOB_ID_REGEX = /[?&](?:jobid|postid|id)=([^&#]+)|\/jobs?\/(\d{2,})/i;

/** Detects remote / work-from-home roles across common US phrasings. */
export const AVIONTE_REMOTE_REGEX =
  /\b(remote|work\s*from\s*home|wfh|telecommute|telework|virtual)\b/i;
