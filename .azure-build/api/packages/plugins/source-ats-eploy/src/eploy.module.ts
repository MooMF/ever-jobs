import { Module } from '@nestjs/common';
import { EployService } from './eploy.service';

@Module({
  providers: [EployService],
  exports: [EployService],
})
export class EployModule {}
