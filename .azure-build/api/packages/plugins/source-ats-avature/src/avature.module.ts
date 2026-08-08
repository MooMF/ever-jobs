import { Module } from '@nestjs/common';
import { AvatureService } from './avature.service';

/**
 * Spec 006 / T02 — `AvatureModule`.
 *
 * Bundles `AvatureService` as a NestJS provider so `JobsModule` (via
 * `ALL_SOURCE_MODULES`) can fan out to Avature-backed company boards.
 * Behavioural logic (HTML pagination, multi-selector chain) lands in
 * Spec 006 / T03; this module ships with a stub `scrape()` that
 * returns an empty `JobResponseDto` so the plugin registers cleanly
 * without introducing any source behaviour ahead of T03.
 */
@Module({
  providers: [AvatureService],
  exports: [AvatureService],
})
export class AvatureModule {}
