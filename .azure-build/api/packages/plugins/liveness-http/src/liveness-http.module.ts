import { Module } from '@nestjs/common';
import { LIVENESS_CHECKER_TOKEN } from '@ever-jobs/models';

import { LivenessHttpService } from './liveness-http.service';

/**
 * NestJS module that binds the HTTP-based `ILivenessChecker`
 * implementation under the public `LIVENESS_CHECKER_TOKEN`
 * (Spec 721 / FR-15). Consumers inject by token, never by class — a
 * future renderer-backed checker can bind the same token without
 * touching its callers.
 */
@Module({
  providers: [
    LivenessHttpService,
    {
      provide: LIVENESS_CHECKER_TOKEN,
      useExisting: LivenessHttpService,
    },
  ],
  exports: [LIVENESS_CHECKER_TOKEN, LivenessHttpService],
})
export class LivenessHttpModule {}
