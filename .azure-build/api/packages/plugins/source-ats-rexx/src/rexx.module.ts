import { Module } from '@nestjs/common';
import { RexxService } from './rexx.service';

@Module({
  providers: [RexxService],
  exports: [RexxService],
})
export class RexxModule {}
