/**
 * Constants for the ReachMee (Talentech) applicant-tracking careers platform.
 *
 * ReachMee (reachmee.com — founded 1999, part of Talentech since 2019) is a
 * Nordic ATS used by Swedish / Norwegian / Danish employers, universities and
 * public-sector bodies. Each customer "installation" publishes a branded,
 * public career page on a numbered ReachMee web host (`web{NNN}.reachmee.com`)
 * and exposes a public, unauthenticated RSS export of every open vacancy from a
 * numbered ReachMee site host (`site{NNN}.reachmee.com`):
 *
 *   GET https://site{NNN}.reachmee.com/Public/rssfeed/external.ashx
 *         ?id={siteId}&InstallationID={installationId}&CustomerName={customer}&lang={lang}
 *     → application/rss+xml, e.g.
 *       <rss version="2.0"><channel>
 *         <title>Available vacancies</title>
 *         <ttl>6</ttl>
 *         <item>
 *           <Area1 id='210'>Örebro</Area1>
 *           <Area2 id='217'>Orebro</Area2>
 *           <occupationArea id='60'>Doctoral student</occupationArea>
 *           <Position id='265'>Doktorand</Position>
 *           <workingHours id='1'>Day</workingHours>
 *           <employmentLevel id='2'>Fixed-term position</employmentLevel>
 *           <country id='143'>Sweden</country>
 *           <Org1>School of Humanities, Education and Social Sciences</Org1>
 *           <CommAdSeqNo>12743</CommAdSeqNo>
 *           <pubDate>Mon, 01 Jun 2026 23:59:00 +0200</pubDate>
 *           <pubDateTo>Mon, 03 Aug 2026 23:59:00 +0200</pubDateTo>
 *           <title>Doctoral students in Media and Communication Studies</title>
 *           <description>&lt;p&gt;…HTML-encoded job body…&lt;/p&gt;</description>
 *           <link>https://web103.reachmee.com/ext/I003/354/main?site=12&amp;validator=…&amp;lang=UK&amp;rmpage=job&amp;rmjob=12743</link>
 *         </item>
 *         …
 *       </channel></rss>
 *
 * The RSS export returns every published vacancy for the installation in one
 * response (no server-side pagination), so we fetch once and slice client-side
 * to honour `resultsWanted`. The `<CommAdSeqNo>` value (also the `rmjob=` query
 * parameter on each `<link>`) is the stable per-vacancy ATS id. Items carry rich
 * custom elements — `Area1`/`Area2`/`country` (location), `occupationArea` /
 * `Position` (role family), `Org1`-`Org3` (organisation unit), `workingHours` /
 * `employmentLevel` (employment type) — which we map to location / department /
 * employmentType, plus an HTML-encoded `<description>` and an RFC-822 `<pubDate>`.
 *
 * NOTE on the official API: Talentech also ships an authenticated REST API for
 * ReachMee, but that is API-key / OAuth gated and therefore unsuitable for a
 * generic, tenant-agnostic, unauthenticated scraper. The public RSS export is
 * the documented, no-auth surface used here.
 *
 * The caller addresses an installation either by a full `companyUrl` (any
 * ReachMee feed / career URL on a `*.reachmee.com` host — its `CustomerName`,
 * `InstallationID`, site `id` and `site{NNN}` host are read verbatim from the
 * query string / host) or by a structured `companySlug` of the form
 * `{customer}@{installationId}:{siteId}` (e.g. `oru@I003:12`) plus an optional
 * trailing `#site{NNN}` host hint (e.g. `oru@I003:12#site106`). A bare
 * `{customer}` slug is accepted but only resolves when the default host / ids
 * below match the installation. An unknown installation (HTTP 4xx), a network
 * error, or a malformed / non-XML payload degrades to an empty (graceful) result
 * rather than throwing, so a single bad tenant never breaks a batch run.
 *
 * Verified live 2026-06-03 (no authentication):
 *  - `GET https://site106.reachmee.com/Public/rssfeed/external.ashx?id=12&InstallationID=I003&CustomerName=oru&lang=UK`
 *    → HTTP 200 RSS XML, channel `<title>Available vacancies</title>`, with live
 *    `<item>` vacancies for **Örebro University (oru)**, each carrying
 *    `<CommAdSeqNo>` (e.g. `12743`), `<title>`, an HTML-encoded `<description>`,
 *    `Area1`/`Area2`/`country` location elements, `occupationArea`/`Position`
 *    role elements, `employmentLevel`/`workingHours`, `Org1`, `<pubDate>` /
 *    `<pubDateTo>` and an absolute `<link>` on `web103.reachmee.com`
 *    (`…&rmpage=job&rmjob={CommAdSeqNo}`).
 *  - Sibling installation confirmed on the same host pattern: **Linköping
 *    University** (`CustomerName` unset / public site `I011`, site `7`,
 *    career host `web103.reachmee.com/ext/I011/853/main?site=7&…`).
 */

/** Default ReachMee RSS feed host (the numbered `site{NNN}` export host). */
export const REACHMEE_FEED_HOST_TEMPLATE = 'https://site{site}.reachmee.com';

/** Root ReachMee domain — used to recognise feed / career hosts passed via `companyUrl`. */
export const REACHMEE_ROOT_DOMAIN = 'reachmee.com';

/**
 * Public, unauthenticated RSS export handler path. Returns every published
 * vacancy for the installation in one response.
 */
export const REACHMEE_RSS_PATH = '/Public/rssfeed/external.ashx';

/**
 * Default numbered feed host label. ReachMee shards installations across several
 * numbered `site{NNN}` hosts; `106` is the host confirmed live for the reference
 * tenant (Örebro University). A caller addressing a different installation passes
 * its own host via `companyUrl` or the `#site{NNN}` slug hint.
 */
export const REACHMEE_DEFAULT_SITE_HOST = '106';

/** Default installation id (Örebro University reference installation). */
export const REACHMEE_DEFAULT_INSTALLATION_ID = 'I003';

/** Default site id (the numeric `id` query parameter; Örebro University = 12). */
export const REACHMEE_DEFAULT_SITE_ID = '12';

/**
 * Default feed language. `UK` (British English) is the platform's English export
 * locale; the Nordic locales are `SE` (Swedish), `NO` (Norwegian), `DK` (Danish).
 * Installations fall back to their default locale for unknown values.
 */
export const REACHMEE_DEFAULT_LANG = 'UK';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest
 * up to 100 of the installation's open vacancies.
 */
export const REACHMEE_DEFAULT_RESULTS = 100;

/** Default request headers. The feed expects a browser-like UA + XML/RSS accept. */
export const REACHMEE_HEADERS: Record<string, string> = {
  Accept: 'application/rss+xml, application/xml, text/xml, */*',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-GB,en;q=0.9,sv;q=0.8',
};

/**
 * Matches a single RSS `<item>…</item>` block (case-insensitive, dot-all). Used
 * to split the feed into per-vacancy chunks before extracting fields.
 */
export const REACHMEE_ITEM_REGEX = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;

/**
 * Extracts the inner text of a named child element, tolerating attributes
 * (ReachMee tags carry `id='…'` attributes) and CDATA wrappers. `{tag}` is
 * substituted at build time per element.
 */
export const REACHMEE_TAG_REGEX_TEMPLATE = '<{tag}\\b[^>]*>([\\s\\S]*?)<\\/{tag}>';

/**
 * Captures the stable per-vacancy id from a canonical `<link>` (the `rmjob=`
 * query parameter, e.g. `…&rmpage=job&rmjob=12743`). Used as a fallback ATS id
 * when `<CommAdSeqNo>` is absent.
 */
export const REACHMEE_LINK_JOB_ID_REGEX = /[?&]rmjob=(\d+)/i;

/**
 * Parses a structured `companySlug` of the form
 * `{customer}@{installationId}:{siteId}` with an optional `#site{NNN}` host hint
 * (e.g. `oru@I003:12#site106`). All three id parts after the customer are
 * optional and fall back to the defaults above.
 */
export const REACHMEE_SLUG_REGEX =
  /^([^@:#\s]+)(?:@([^:#\s]+))?(?::([^#\s]+))?(?:#site([0-9]+))?$/i;

/** Detects remote / work-from-home roles across Nordic + EN phrasings. */
export const REACHMEE_REMOTE_REGEX =
  /\b(remote|distans|distansarbete|hemarbete|hjemmekontor|hjemmefra|home\s*office|work\s*from\s*home|wfh|p[åa]\s*distans)\b/i;
