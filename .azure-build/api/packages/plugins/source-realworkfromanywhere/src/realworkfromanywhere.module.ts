import { Module } from '@nestjs/common';
import { RealWorkFromAnywhereService } from './realworkfromanywhere.service';

@Module({
  providers: [RealWorkFromAnywhereService],
  exports: [RealWorkFromAnywhereService],
})
export class RealWorkFromAnywhereModule {}
