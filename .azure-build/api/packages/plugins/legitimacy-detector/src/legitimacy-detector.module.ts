import { Module } from '@nestjs/common';
import { LEGITIMACY_CHECKER_TOKEN } from '@ever-jobs/models';

import { LegitimacyDetectorService } from './legitimacy-detector.service';

/**
 * NestJS module binding the deterministic `ILegitimacyChecker` implementation under the public
 * `LEGITIMACY_CHECKER_TOKEN` (Spec 740). Consumers inject by token, never by class — a future
 * model-backed detector can bind the same token without touching its callers.
 */
@Module({
  providers: [
    LegitimacyDetectorService,
    {
      provide: LEGITIMACY_CHECKER_TOKEN,
      useExisting: LegitimacyDetectorService,
    },
  ],
  exports: [LEGITIMACY_CHECKER_TOKEN, LegitimacyDetectorService],
})
export class LegitimacyDetectorModule {}
