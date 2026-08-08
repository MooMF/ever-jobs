import { Module } from '@nestjs/common';
import { EmplyService } from './emply.service';

@Module({
  providers: [EmplyService],
  exports: [EmplyService],
})
export class EmplyModule {}
