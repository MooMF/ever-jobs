import { Module } from '@nestjs/common';
import { HirehiveService } from './hirehive.service';

@Module({
  providers: [HirehiveService],
  exports: [HirehiveService],
})
export class HirehiveModule {}
