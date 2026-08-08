/**
 * Constants for the Teamdash recruitment platform.
 *
 * Teamdash is an Estonian, cloud-based recruitment ATS used by in-house
 * recruiting teams across the Nordics and the EU. Every customer tenant is
 * served from its own sub-domain under the shared apex `teamdash.com`
 * (e.g. `https://cr14.teamdash.com/`), and some tenants also publish their
 * career pages on a custom domain.
 *
 * Public surface (no authentication required)
 * -------------------------------------------
 * Teamdash does NOT expose an anonymous JSON job-listing API. Instead, every
 * public **career page** and **job posting** is a server-side-rendered
 * "landing" page whose full state is embedded directly in the HTML as a single
 * `window.context = { ... }` JSON assignment in an inline `<script>`. The
 * Vue front-end hydrates from this blob; there is no follow-up XHR needed to
 * read the listing.
 *
 *   1. **Career page (the listing)** —
 *      `GET https://{tenant}.teamdash.com/p/job/{landingToken}/{slug}`
 *      The HTML embeds:
 *        window.context = {
 *          is_landing: true,
 *          instance_name: "cr14",
 *          landing: { id, slug, data: { meta, theme, blocks, ... } },
 *          career_page_feed_contents: {
 *            "<feedSlug>": [
 *              { url, title, location, imageUrl,
 *                customFields, customFieldDisplayValues }
 *            ]
 *          },
 *          languages: { ... }, url_language, ...
 *        }
 *      `career_page_feed_contents` is a map of feed-slug → array of job
 *      summaries. Each summary carries the canonical `url` of the job posting,
 *      its `title`, and a free-text `location`. This is the listing source.
 *
 *   2. **Job posting (the detail)** —
 *      `GET https://{tenant}.teamdash.com/p/job/{token}/{slug}`
 *      The HTML embeds the same `window.context` shape, but with
 *      `landing.full: true` and a richer `landing` object:
 *        landing: {
 *          id, slug, status: "active", page_type: "landing",
 *          default_language: "en", permalink, display_name,
 *          created_at, updated_at, stage: { name, ... },
 *          data: { meta: { title, description, imageUrl },
 *                  blocks: [ { type, content: { <lang>: "<html>" } } ] }
 *        }
 *      The job description is assembled from the translatable HTML `content`
 *      of the `landing.data.blocks[]` (block types such as
 *      `LandingBgImageTextBlock`, `LandingHalfVideoTextBlock`, `LandingHeroBlock`).
 *      `data.meta.title` is the canonical job title; `created_at` /
 *      `updated_at` give the post date.
 *
 * Tenant + entry-point resolution
 * -------------------------------
 * `companyUrl` (preferred) is the full career-page URL of a tenant
 * (e.g. `https://cr14.teamdash.com/p/job/20eH77Ul/career-page`). The plugin
 * fetches it directly and reads `career_page_feed_contents`.
 *
 * `companySlug` is the tenant sub-domain label (e.g. `cr14`). Because the
 * career-page landing token is opaque (Teamdash assigns a random token per
 * landing), a slug-only caller has no fixed listing URL. The plugin attempts
 * the well-known `career-page` landing-slug path under the tenant sub-domain
 * and degrades to an empty result if Teamdash does not resolve it. Supplying
 * the full `companyUrl` is the reliable path.
 *
 * Verified live against `cr14.teamdash.com` on 2026-06-03:
 *   - `GET /p/job/20eH77Ul/career-page` → HTTP 200, `window.context` present,
 *     `career_page_feed_contents.karjaarileht` = 2 open roles
 *     ("Software Developer" — Tallinn, Estonia; "Kvaliteedijuht" — Tallinn).
 *   - `GET /p/job/DJQJDUk1/full-stack-developer` → HTTP 200, `landing.full`,
 *     `data.meta.title` = "Full Stack Developer", `created_at`
 *     "2025-01-21T11:46:41.000000Z", `status` "active", HTML description
 *     present across `data.blocks[]`.
 */

/** Shared apex for every Teamdash-hosted tenant sub-domain. */
export const TEAMDASH_APEX = 'teamdash.com';

/** Host template for Teamdash-hosted tenants; `{tenant}` is substituted at runtime. */
export const TEAMDASH_HOST_TEMPLATE = 'https://{tenant}.teamdash.com';

/**
 * Path template for a tenant's public career-page landing.
 * `{slug}` defaults to the well-known `career-page` landing slug. Used only as
 * a best-effort fallback when a slug-only caller supplies no full `companyUrl`.
 */
export const TEAMDASH_CAREER_PAGE_PATH_TEMPLATE = '/p/job/{slug}';

/** Well-known landing slug Teamdash assigns to the default career page. */
export const TEAMDASH_DEFAULT_CAREER_SLUG = 'career-page';

/**
 * Marker that begins the inline JSON state blob in every public Teamdash page.
 * The value following this marker is a balanced `{ ... }` JSON object.
 */
export const TEAMDASH_CONTEXT_MARKER = 'window.context = ';

/**
 * Block types whose `content` carries the human-readable description HTML on a
 * job-posting landing. Used to assemble the description from `data.blocks[]`.
 * Any block exposing a translatable `content` map is included regardless, so
 * this list is informative rather than exhaustive.
 */
export const TEAMDASH_DESCRIPTION_BLOCK_TYPES: readonly string[] = [
  'LandingBgImageTextBlock',
  'LandingHalfVideoTextBlock',
  'LandingTextBlock',
  'LandingHeroBlock',
  'LandingContactBlock',
];

/** Maximum number of job-detail fetches issued concurrently per pagination round. */
export const TEAMDASH_MAX_CONCURRENCY = 6;

/** Delay (ms) between sequential detail-fetch rounds, to stay polite. */
export const TEAMDASH_REQUEST_DELAY_MS = 250;

/**
 * Default internal results cap. When `resultsWanted` is omitted entirely we
 * ingest up to this many of the tenant's open roles.
 */
export const TEAMDASH_DEFAULT_RESULTS = 100;

/**
 * Default request headers. The public landing pages are plain SSR HTML; a
 * browser-like Accept and User-Agent are polite and avoid bot-gating.
 */
export const TEAMDASH_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};
