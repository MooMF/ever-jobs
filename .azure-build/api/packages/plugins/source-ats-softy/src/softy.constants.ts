/**
 * Constants for the Softy (softy.pro) careers platform.
 *
 * Softy (softy.pro, Dijon, France — a 100% French ATS / recruitment suite) powers
 * each customer tenant's branded, public, unauthenticated candidate-facing careers
 * board on its own sub-domain of the shared application host, addressed by the
 * tenant slug:
 *
 *   https://{tenant}.softy.pro/offres        (open-roles index — French)
 *   https://{tenant}.softy.pro/offers         (open-roles index — English alias)
 *
 * The index is **server-rendered HTML** (not a client-rendered SPA), so the open-
 * roles list is directly crawlable without authentication. Each open role renders
 * as a card whose anchor is the canonical detail / apply URL:
 *
 *   https://{tenant}.softy.pro/offre/{ID}-{title-slug}
 *
 * The leading numeric `{ID}` path segment (e.g. `208303`) is the stable Softy ATS
 * id; the `{title-slug}` is a de-slugifiable rendering of the title. Each index
 * card also carries labelled text immediately around the anchor: the role title,
 * the work location (a French city, e.g. `Toulouse`), the contract type
 * (`CDI`, `CDD`, `Apprentissage - 24 Mois`, `Stage - 4 Mois`, …) and a
 * "Mise en ligne le DD/MM/YYYY" published-date line.
 *
 * The caller addresses a tenant by `companySlug` (the sub-domain label, e.g.
 * `groupecls`) or by `companyUrl` (a board URL on a `softy.pro` host, from which the
 * tenant sub-domain label is derived). An unknown tenant resolves to a host that
 * answers an HTTP 4xx / empty board, so it degrades naturally to an empty result. A
 * fetch error, an HTTP 4xx, a DNS failure, or a malformed body degrades to an empty
 * / partial result rather than throwing, so a single bad tenant never breaks a batch.
 *
 * Surface confidence (researched + verified live 2026-06-03, no authentication):
 *  - Confirmed the platform + tenant addressing (`{tenant}.softy.pro/offres`) and
 *    real, named tenants on it: `ensio` (ENSIO — 85 open roles at time of research),
 *    `groupecls` (Groupe CLS) and `recrutcl` (ReCrut'). The board is server-rendered
 *    HTML listing each role as the canonical anchor
 *    `https://{tenant}.softy.pro/offre/{ID}-{title-slug}` with labelled card fields
 *    (title, location, contract type, "Mise en ligne le DD/MM/YYYY") — verified=true.
 *  - The per-role detail page is server-rendered HTML but carries no schema.org
 *    JobPosting JSON-LD and no og: meta; the index card text is the structured
 *    listing-level data, and the detail page body is fetched best-effort for a
 *    richer description.
 */

/** Root domain — used to recognise tenant hosts / URLs passed via `companyUrl`. */
export const SOFTY_ROOT_DOMAIN = 'softy.pro';

/** URL scheme used to build a tenant board host from a bare slug. */
export const SOFTY_SCHEME = 'https://';

/** Public server-rendered open-roles index path (French). This is the scraping surface. */
export const SOFTY_OFFERS_PATH = '/offres';

/** Canonical per-role detail / apply path segment (used to build/parse job URLs). */
export const SOFTY_OFFER_PATH = '/offre/';

/**
 * Default internal results cap. Mirrors the sibling ATS adapters: the public DTO
 * default is small, but when a caller omits `resultsWanted` entirely we ingest up
 * to 100 of the tenant's open roles.
 */
export const SOFTY_DEFAULT_RESULTS = 100;

/**
 * Hard ceiling on detail pages fetched per scrape. The index renders the full tenant
 * board in a single document; the ceiling bounds the optional per-role detail fan-out
 * so a large board never balloons into hundreds of requests.
 */
export const SOFTY_MAX_DETAIL_FETCHES = 100;

/** Default request headers. The board expects a browser-like UA + HTML Accept. */
export const SOFTY_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129 Safari/537.36',
  'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
};

/**
 * Matches a canonical Softy detail anchor inside the index HTML, capturing the
 * numeric job id and the title slug:
 *   /offre/{ID}-{title-slug}
 * The id is a run of digits; the slug runs up to the next quote / whitespace / query.
 */
export const SOFTY_OFFER_LINK_REGEX = /\/offre\/(\d+)-([^"'?#\s<>]+)/gi;

/**
 * Matches a "Mise en ligne le DD/MM/YYYY" published-date line in a card window,
 * capturing the day / month / year parts.
 */
export const SOFTY_PUBLISHED_REGEX = /Mise\s+en\s+ligne\s+le\s+(\d{1,2})\/(\d{1,2})\/(\d{4})/i;

/**
 * Recognises a French (or English) contract-type token in a card window, e.g.
 * "CDI", "CDD", "Apprentissage - 24 Mois", "Stage - 4 Mois", "Intérim",
 * "Freelance", "Temps plein", "Temps partiel".
 */
export const SOFTY_CONTRACT_REGEX =
  /\b(CDI|CDD|Apprentissage|Alternance|Stage|Int[eé]rim|Freelance|Temps\s+(?:plein|partiel)|Internship|Apprenticeship|Permanent|Contract)\b[^\r\n<]*/i;

/** Detects remote / télétravail roles across the title, location, and contract fields. */
export const SOFTY_REMOTE_REGEX =
  /\b(remote|t[ée]l[ée]travail|home[\s-]?(?:based|working)|work\s*from\s*home|wfh|fully\s*remote|100\s*%\s*distanciel|distanciel)\b/i;
