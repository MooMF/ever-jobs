import { Module } from '@nestjs/common';
import { DEDUP_ENGINE_TOKEN } from '@ever-jobs/models';
import { DedupHybridService } from './dedup-hybrid.service';

/**
 * NestJS module that binds the default `IDedupEngine` implementation under
 * the public `DEDUP_ENGINE_TOKEN`. Consumers (e.g. `JobsAggregator` in
 * Phase 5) inject by token, never by class — that's what keeps the engine
 * swappable per Spec 003 / FR-1.
 */
@Module({
  providers: [
    DedupHybridService,
    {
      provide: DEDUP_ENGINE_TOKEN,
      useExisting: DedupHybridService,
    },
  ],
  exports: [DEDUP_ENGINE_TOKEN, DedupHybridService],
})
export class DedupHybridModule {}
