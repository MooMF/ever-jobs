import { Module } from '@nestjs/common';
import { MERGE_RESOLVER_TOKEN } from '@ever-jobs/models';
import { MergeDefaultService } from './merge-default.service';

/**
 * NestJS module that binds the default `IMergeResolver` implementation
 * under the public `MERGE_RESOLVER_TOKEN`. Consumers (the dedup engine,
 * `JobsAggregator`) inject by token, never by class — that's what keeps
 * the resolver swappable per Spec 003 / FR-4.
 */
@Module({
  providers: [
    MergeDefaultService,
    {
      provide: MERGE_RESOLVER_TOKEN,
      useExisting: MergeDefaultService,
    },
  ],
  exports: [MERGE_RESOLVER_TOKEN, MergeDefaultService],
})
export class MergeDefaultModule {}
