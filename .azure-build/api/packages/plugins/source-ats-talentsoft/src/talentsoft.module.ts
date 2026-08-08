import { Module } from '@nestjs/common';
import { TalentsoftService } from './talentsoft.service';

@Module({
  providers: [TalentsoftService],
  exports: [TalentsoftService],
})
export class TalentsoftModule {}
