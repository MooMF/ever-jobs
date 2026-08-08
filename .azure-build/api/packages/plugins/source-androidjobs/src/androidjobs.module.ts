import { Module } from '@nestjs/common';
import { AndroidjobsService } from './androidjobs.service';

@Module({
  providers: [AndroidjobsService],
  exports: [AndroidjobsService],
})
export class AndroidjobsModule {}
