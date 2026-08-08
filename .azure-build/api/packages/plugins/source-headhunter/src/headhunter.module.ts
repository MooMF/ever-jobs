import { Module } from '@nestjs/common';
import { HeadhunterService } from './headhunter.service';

@Module({
  providers: [HeadhunterService],
  exports: [HeadhunterService],
})
export class HeadhunterModule {}
