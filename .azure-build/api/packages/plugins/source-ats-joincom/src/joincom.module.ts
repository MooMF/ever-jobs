import { Module } from '@nestjs/common';
import { JoinComService } from './joincom.service';

/**
 * Spec 006 / T02 — `JoinComModule`.
 *
 * Bundles `JoinComService` as a NestJS provider so `JobsModule` (via
 * `ALL_SOURCE_MODULES`) can fan out to the Join.com REST API.
 * Behavioural logic (two-step REST flow: HTML scrape for company id,
 * then `/api/public/companies/<id>/jobs` paginated retrieval with
 * polite pacing) lands in Spec 006 / T07; this module ships with a
 * stub `scrape()` returning an empty `JobResponseDto`.
 */
@Module({
  providers: [JoinComService],
  exports: [JoinComService],
})
export class JoinComModule {}
