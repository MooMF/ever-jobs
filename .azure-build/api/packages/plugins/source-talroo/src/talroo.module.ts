import { Module } from '@nestjs/common';
import { TalrooService } from './talroo.service';

@Module({
  providers: [TalrooService],
  exports: [TalrooService],
})
export class TalrooModule {}
