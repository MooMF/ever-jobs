import {
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Inject,
  Logger,
  NotFoundException,
  Optional,
  Param,
  Post,
  Query,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import {
  CIRCUIT_BREAKER_TOKEN,
  DEFAULT_CIRCUIT_POLICY,
  ICircuitBreakerService,
  Site,
  SourceHealth,
} from '@ever-jobs/models';
import { PluginRegistry } from '@ever-jobs/plugin';
import { AdminAuth } from '../auth/admin-auth.decorator';

/**
 * Source-health controller — Spec 005 / FR-5 / FR-7 / T05 + T07.
 *
 * Exposes:
 *   - `GET  /api/sources/health`               — per-`Site` snapshots (T05)
 *   - `POST /api/sources/:site/circuit/open`   — force-open a breaker (T07)
 *   - `POST /api/sources/:site/circuit/reset`  — force-reset a breaker (T07)
 *
 * The read endpoint is subject to the standard global `ApiKeyGuard`
 * (no-op when `auth.enabled=false`). The admin endpoints are decorated
 * with `@AdminAuth()` and ALWAYS require a valid key — see
 * `apps/api/src/auth/api-key.guard.ts` and Q-017.
 *
 * Output ordering on `GET health` is by `Site` name (alphabetical) so
 * a dashboard can render stable rows without re-sorting client-side.
 *
 * **Why this lives under `apps/api/src/jobs/`** — Spec 005 / T05 names the
 * file. The breaker is bound through `JobsModule` (it imports
 * `CircuitBreakerModule`); putting the controller in the same module keeps
 * the DI graph shallow and self-contained. The route path prefix
 * (`/api/sources/...`) is intentionally distinct from `JobsController`'s
 * `/api/jobs/*` so the URL surface stays operator-facing.
 *
 * **Optional registry overlay (Q-014)** — by default `breaker.list()`
 * returns only sites the breaker has actually seen (lazy-init). A
 * `?include=all` query param overlays every registered plugin with a
 * synthetic "closed / no-data" snapshot so operators can also confirm that
 * a registered source has not yet been called this process. The overlay
 * does **not** mutate breaker state — it composes purely from
 * `PluginRegistry.listSiteKeys()` and never touches `breaker.health(site)`
 * for unseen sites (which would otherwise create a real entry and inflate
 * the per-process memory ceiling — Spec 005 / NFR-3).
 */
@ApiTags('Health')
@Controller('api/sources')
export class SourcesHealthController {
  private readonly logger = new Logger(SourcesHealthController.name);

  /**
   * Lazily-built `Set<string>` of every valid `Site` enum value so the
   * `:site` path-param check is O(1). Built once on first use; the enum
   * is a static collection so we never have to invalidate it.
   */
  private readonly validSites: Set<string> = new Set<string>(
    Object.values(Site) as string[],
  );

  constructor(
    @Optional()
    @Inject(CIRCUIT_BREAKER_TOKEN)
    private readonly breaker?: ICircuitBreakerService,
    @Optional() private readonly registry?: PluginRegistry,
  ) {}

  /**
   * `GET /api/sources/health` — returns per-site `SourceHealth` snapshots.
   *
   * Query params:
   *   - `include=all` — overlay every registered plugin (default: only
   *     return sites the breaker has actually observed).
   *
   * Response shape: `{ count: number; sources: SourceHealth[] }`.
   *
   * The `count` field is convenience for monitoring scripts that want to
   * alert on "fewer than N sources reporting"; consumers that only care
   * about the array can ignore it. Both fields are stable.
   */
  @Get('health')
  @Header('Cache-Control', 'public, max-age=1')
  @ApiOperation({
    summary: 'List per-source health snapshots',
    description:
      "Returns each source's circuit-breaker state, success rate and " +
      'p95 latency over the rolling window. Use `?include=all` to also ' +
      'list registered plugins that have not yet been called this process ' +
      '(those rows report state=closed, successRate=1, p95LatencyMs=0).',
  })
  @ApiQuery({
    name: 'include',
    required: false,
    description:
      'Set to "all" to overlay every registered plugin with a synthetic ' +
      'closed/no-data row. Default returns only sites the breaker has ' +
      'observed at least once.',
    example: 'all',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of per-source health snapshots.',
  })
  list(@Query('include') include?: string): {
    count: number;
    sources: SourceHealth[];
  } {
    if (!this.breaker) {
      this.logger.warn(
        'No circuit-breaker bound under CIRCUIT_BREAKER_TOKEN; returning empty list',
      );
      return { count: 0, sources: [] };
    }

    const observed = this.breaker.list();
    const observedSites = new Set(observed.map((h) => h.site));

    let merged: SourceHealth[] = observed;

    if (include === 'all' && this.registry) {
      const synthetic: SourceHealth[] = [];
      for (const site of this.registry.listSiteKeys()) {
        if (observedSites.has(site)) continue;
        synthetic.push({
          site,
          state: 'closed',
          successRate: 1,
          p95LatencyMs: 0,
          windowMs: DEFAULT_CIRCUIT_POLICY.rollingWindowMs,
        });
      }
      merged = [...observed, ...synthetic];
    }

    merged.sort((a, b) => siteCompare(a.site, b.site));
    return { count: merged.length, sources: merged };
  }

  /**
   * `POST /api/sources/:site/circuit/open` — force the named source's
   * breaker into the `open` state. Returns the post-action `SourceHealth`
   * snapshot so callers can re-render the row from a single round-trip
   * (Q-017 default).
   *
   * Auth: `@AdminAuth()` — always requires a valid `x-api-key`. 401 on
   * missing/invalid key, 503 if no `API_KEYS` are configured at all.
   */
  @Post(':site/circuit/open')
  @AdminAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Force a source circuit breaker into the open state',
    description:
      'Operator action: short-circuits all `scrape()` calls for the ' +
      'named source until an explicit reset. Requires an API key.',
  })
  @ApiSecurity('ApiKey')
  @ApiResponse({
    status: 200,
    description: 'Breaker forced open; returns the new SourceHealth row.',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key.' })
  @ApiResponse({ status: 404, description: 'Unknown :site path parameter.' })
  @ApiResponse({
    status: 503,
    description: 'Admin endpoints disabled (no API keys configured).',
  })
  forceOpen(@Param('site') siteParam: string): {
    ok: true;
    site: Site;
    health: SourceHealth;
  } {
    const site = this.assertSite(siteParam);
    const breaker = this.assertBreaker();
    breaker.forceOpen(site);
    this.logger.warn(`Admin force-open: ${site}`);
    return { ok: true, site, health: breaker.health(site) };
  }

  /**
   * `POST /api/sources/:site/circuit/reset` — force the named source's
   * breaker back to `closed` and clear the rolling-window samples. Same
   * payload contract as `/circuit/open` — `{ ok, site, health }` after
   * the action.
   *
   * Auth: `@AdminAuth()` — see `forceOpen` for details.
   */
  @Post(':site/circuit/reset')
  @AdminAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset a source circuit breaker back to the closed state',
    description:
      'Operator action: clears any forced-open state and the rolling-' +
      'window samples for the named source. Requires an API key.',
  })
  @ApiSecurity('ApiKey')
  @ApiResponse({
    status: 200,
    description: 'Breaker reset; returns the new SourceHealth row.',
  })
  @ApiResponse({ status: 401, description: 'Missing or invalid API key.' })
  @ApiResponse({ status: 404, description: 'Unknown :site path parameter.' })
  @ApiResponse({
    status: 503,
    description: 'Admin endpoints disabled (no API keys configured).',
  })
  forceReset(@Param('site') siteParam: string): {
    ok: true;
    site: Site;
    health: SourceHealth;
  } {
    const site = this.assertSite(siteParam);
    const breaker = this.assertBreaker();
    breaker.forceReset(site);
    this.logger.log(`Admin force-reset: ${site}`);
    return { ok: true, site, health: breaker.health(site) };
  }

  private assertSite(siteParam: string): Site {
    if (!this.validSites.has(siteParam)) {
      throw new NotFoundException(`Unknown source: ${siteParam}`);
    }
    return siteParam as Site;
  }

  private assertBreaker(): ICircuitBreakerService {
    if (!this.breaker) {
      // Should never happen in production: `JobsModule` imports
      // `CircuitBreakerModule`. If the breaker is missing the runtime
      // is misconfigured — return 503 rather than a misleading 200.
      this.logger.error(
        'Admin endpoint invoked without CIRCUIT_BREAKER_TOKEN bound',
      );
      throw new ServiceUnavailableException(
        'Circuit breaker not bound; admin endpoints unavailable',
      );
    }
    return this.breaker;
  }
}

/**
 * Locale-stable `Site` comparator. `Site` enum values are kebab-case
 * strings (`'linkedin'`, `'source-ats-ashby'`, etc.) — a plain `<` over
 * strings is enough; we wrap it for readability and so a future change of
 * the underlying type (e.g. wrapping in an opaque branded type) doesn't
 * silently break ordering at the call site.
 */
function siteCompare(a: Site, b: Site): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}
