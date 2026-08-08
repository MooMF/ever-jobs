import { Module } from '@nestjs/common';
import { OracleService } from './oracle.service';

/**
 * Spec 013 / T02 — `OracleModule`.
 *
 * Bundles `OracleService` as a NestJS provider so `JobsModule` (via
 * `ALL_SOURCE_MODULES`) can fan out to the Oracle HCM Cloud
 * (`recruitingCEJobRequisitions`) finder REST API. Behavioural logic
 * (URL composition from `companyUrl` / `companySlug`, finder-string
 * pagination at `limit=100;offset=N;sortBy=POSTING_DATES_DESC`,
 * sentinel error mapping) lands in Spec 013 / T03; this module ships
 * with a stub `scrape()` returning an empty `JobResponseDto`.
 */
@Module({
  providers: [OracleService],
  exports: [OracleService],
})
export class OracleModule {}
