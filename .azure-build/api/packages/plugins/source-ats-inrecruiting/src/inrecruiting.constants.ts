/**
 * Constants for the In-recruiting (Intervieweb) careers platform.
 *
 * In-recruiting (in-recruiting.com) is the Applicant Tracking System / recruiting
 * software built by Intervieweb Srl (Turin, Italy; part of the Zucchetti Group). Every
 * customer tenant publishes a branded, public, unauthenticated candidate-facing career
 * site on the shared application host `*.intervieweb.it`, addressed by its tenant slug.
 * Two host/path shapes are in production use:
 *
 *   1. Sub-domain tenant (classic career site):
 *        https://{tenant}.intervieweb.it/{lang}/career
 *        → roles link to https://{tenant}.intervieweb.it/jobs/{slug}-{id}/{lang}/
 *
 *   2. Shared-host + path tenant (the "SMART" career site variant), where many
 *      tenants live under one host segment:
 *        https://{host}.intervieweb.it/{tenant}/{lang}/career
 *        → roles link to https://{host}.intervieweb.it/{tenant}/jobs/{slug}-{id}/{lang}/
 *
 * Both forms render the open-roles index as **server-rendered HTML** (not a SPA): each
 * open role is a `vacancy__` card carrying a canonical `/jobs/{slug}-{id}/{lang}/`
 * anchor plus labelled card text ("Location …", "Functional Area …"). The trailing
 * numeric `{id}` segment of the job URL (e.g. `410`, `705638`) is the stable In-recruiting
 * ATS id; the anchor URL is the canonical detail / apply URL.
 *
 * Each role's server-rendered detail page often embeds a schema.org `JobPosting`
 * JSON-LD block (title, description HTML, datePosted, validThrough, employmentType,
 * hiringOrganization.name, jobLocation.address {locality/region/country/postalCode}).
 * That JSON-LD is the richest structured source when present; some tenant variants
 * (notably the "SMART" path-tenant career sites) omit it, so the adapter falls back to
 * `og:` meta, the `<title>`, and the listing-card fields, all narrowed defensively.
 *
 * The caller addresses a tenant by `companySlug` (e.g. `rinascente`, or `orbyta` for a
 * path-tenant) or by `companyUrl` (a career / job URL on an `intervieweb.it` host whose
 * sub-domain and/or first path segment encode the tenant). An unknown tenant (or one
 * with no open roles) renders a board with zero `/jobs/` anchors, so it degrades
 * naturally to an empty result. A fetch error, an HTTP 4xx, a DNS failure, or a
 * malformed body degrades to an empty / partial result rather than throwing, so a
 * single bad tenant never breaks a batch run.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + both tenant-addressing shapes on `*.intervieweb.it` and
 *    real, named tenants on each:
 *      - sub-domain tenant: `rinascente` (RINASCENTE,
 *        `https://rinascente.intervieweb.it/en/career`, multiple open roles).
 *      - path tenant: `orbyta` (ORBYTA / "Inrecruiting SMART",
 *        `https://inrecruiting.intervieweb.it/orbyta/en/career`, multiple open roles).
 *  - Confirmed the server-rendered index lists each role with the canonical job URL
 *    shape `/jobs/{slug}-{id}/{lang}/` (e.g. `/jobs/communication-manager-410/en/`,
 *    `/jobs/angular-developer-401435/en/`) with the trailing numeric `{id}` as the per-
 *    role ATS id, and that the classic detail page embeds a schema.org `JobPosting`
 *    JSON-LD block (verified=true). The "SMART" detail variant omits JSON-LD, so the
 *    adapter additionally parses `og:` meta / `<title>` / body and the listing-card
 *    fields, all defensively.
 */

/** Root domain — the shared In-recruiting / Intervieweb application host suffix. */
export const INRECRUITING_ROOT_DOMAIN = 'intervieweb.it';

/** Marketing / brand domain (used only to recognise it if passed; never fetched). */
export const INRECRUITING_BRAND_DOMAIN = 'in-recruiting.com';

/** Default candidate-facing language segment used when building career / job URLs. */
export const INRECRUITING_DEFAULT_LANG = 'en';

/** Career-board path segment (used to build the open-roles index URL). */
export const INRECRUITING_CAREER_PATH = 'career';

/** Job detail path segment (used to recognise / build canonical job URLs). */
export const INRECRUITING_JOBS_PATH = 'jobs';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest up to
 * 100 of the tenant's open roles.
 */
export const INRECRUITING_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on detail pages fetched per scrape. The index renders the full tenant
 * board in one document (no server-side pagination of the job set), so this bounds the
 * per-role detail fan-out to a sane maximum.
 */
export const INRECRUITING_MAX_DETAILS = 100;

/** Default request headers. The board expects a browser-like UA + HTML Accept. */
export const INRECRUITING_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

/**
 * Matches a canonical In-recruiting job link inside the board HTML, capturing the path
 * that precedes `/jobs/`, the slug-plus-id token, and (separately) the trailing numeric
 * id, across both addressing shapes:
 *   https://{tenant}.intervieweb.it/jobs/{slug}-{id}/{lang}/
 *   https://{host}.intervieweb.it/{tenant}/jobs/{slug}-{id}/{lang}/
 * Group 1 = full absolute href; group 2 = `{slug}-{id}` token; group 3 = numeric `{id}`.
 */
export const INRECRUITING_JOB_LINK_REGEX =
  /(https?:\/\/[a-z0-9-]+\.intervieweb\.it\/(?:[a-z0-9_-]+\/)?jobs\/([a-z0-9-]*?-(\d+))\/[a-z]{2}\/?)/gi;

/**
 * Extracts the trailing numeric ATS id from a `{slug}-{id}` job token (e.g.
 * `communication-manager-410` → `410`).
 */
export const INRECRUITING_ID_FROM_TOKEN_REGEX = /-(\d+)$/;

/** Reads a labelled listing-card subtitle span (title="Location" / "Functional Area"). */
export const INRECRUITING_CARD_FIELD_REGEX =
  /<span[^>]*class="subtitle__informations"[^>]*title="([^"]+)"[^>]*>([\s\S]*?)<\/span>/gi;

/** Extracts a schema.org `JobPosting` JSON-LD block from a detail page. */
export const INRECRUITING_JSONLD_REGEX =
  /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

/** Extracts an `og:`/`twitter:` meta tag's content (property/name first, then content). */
export const INRECRUITING_OG_META_REGEX =
  /<meta[^>]+(?:property|name)=["'](og:[^"']+|twitter:[^"']+)["'][^>]*content=["']([^"']*)["'][^>]*>/gi;

/** Extracts the document `<title>` text as a last-resort title fallback. */
export const INRECRUITING_TITLE_REGEX = /<title[^>]*>([\s\S]*?)<\/title>/i;

/** Detects remote / home-working roles across the title, location, and card fields. */
export const INRECRUITING_REMOTE_REGEX =
  /\b(remote|smart[\s-]?working|home[\s-]?(?:based|working|office)|work\s*from\s*home|wfh|telework|telecommute|fully\s*remote|da\s*remoto|lavoro\s*agile)\b/i;
