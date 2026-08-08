import { Module } from '@nestjs/common';
import { BaytService } from './bayt.service';

@Module({
  providers: [BaytService],
  exports: [BaytService],
})
export class BaytModule {}
