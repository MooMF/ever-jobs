import { Module } from '@nestjs/common';
import { DvinciService } from './dvinci.service';

@Module({
  providers: [DvinciService],
  exports: [DvinciService],
})
export class DvinciModule {}
