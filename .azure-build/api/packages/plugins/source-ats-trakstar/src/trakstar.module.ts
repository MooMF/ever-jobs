import { Module } from '@nestjs/common';
import { TrakstarService } from './trakstar.service';

@Module({
  providers: [TrakstarService],
  exports: [TrakstarService],
})
export class TrakstarModule {}
