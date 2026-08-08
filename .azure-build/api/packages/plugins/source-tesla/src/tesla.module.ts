import { Module } from '@nestjs/common';
import { TeslaService } from './tesla.service';

/**
 * Spec 013 / T02 — `TeslaModule` (default, pure-HTTP).
 *
 * Bundles `TeslaService` as a NestJS provider so `JobsModule` (via
 * `ALL_SOURCE_MODULES`) can fan out to Tesla's single-tenant careers
 * site. Behavioural logic (board GET to
 * `https://www.tesla.com/cua-api/apps/careers/state` with rotated UA;
 * detail-fetch fan-out to `/cua-api/careers/job/{id}` budgeted by
 * `descriptionDepth`; Akamai sentinel on 403/503/HTML response) lands
 * in Spec 013 / T07; this module ships with a stub `scrape()`
 * returning an empty `JobResponseDto`.
 *
 * **This package is HTTP-only.** Playwright support lives in the
 * OPTIONAL companion package `@ever-jobs/source-tesla-playwright`
 * (per Spec 013 / Q-028 / FR-13). Do NOT add `playwright` to this
 * service.
 */
@Module({
  providers: [TeslaService],
  exports: [TeslaService],
})
export class TeslaModule {}
