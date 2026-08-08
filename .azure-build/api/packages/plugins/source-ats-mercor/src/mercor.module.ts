import { Module } from '@nestjs/common';
import { MercorService } from './mercor.service';

/**
 * Spec 013 / T02 — `MercorModule`.
 *
 * Bundles `MercorService` as a NestJS provider so `JobsModule` (via
 * `ALL_SOURCE_MODULES`) can fan out to the Mercor catalogue-wide
 * explore-page endpoint. Behavioural logic (single GET to
 * `https://aws.api.mercor.com/work/listings-explore-page` with the
 * literal `Authorization: Bearer` header, post-filter on `companyName`
 * substring match) lands in Spec 013 / T05; this module ships with a
 * stub `scrape()` returning an empty `JobResponseDto`.
 */
@Module({
  providers: [MercorService],
  exports: [MercorService],
})
export class MercorModule {}
