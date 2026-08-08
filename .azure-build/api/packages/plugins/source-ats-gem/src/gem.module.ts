import { Module } from '@nestjs/common';
import { GemService } from './gem.service';

/**
 * Spec 006 / T02 — `GemModule`.
 *
 * Bundles `GemService` as a NestJS provider so `JobsModule` (via
 * `ALL_SOURCE_MODULES`) can fan out to the Gem GraphQL batch endpoint.
 * Behavioural logic (single POST to `/graphql/batch` with both
 * `JobBoardTheme` and `JobBoardList` operations, response-order
 * tolerance) lands in Spec 006 / T05; this module ships with a stub
 * `scrape()` returning an empty `JobResponseDto` so the plugin
 * registers cleanly without introducing source behaviour ahead of T05.
 */
@Module({
  providers: [GemService],
  exports: [GemService],
})
export class GemModule {}
