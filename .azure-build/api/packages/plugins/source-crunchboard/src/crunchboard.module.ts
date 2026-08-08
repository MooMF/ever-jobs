import { Module } from '@nestjs/common';
import { CrunchboardService } from './crunchboard.service';

@Module({
  providers: [CrunchboardService],
  exports: [CrunchboardService],
})
export class CrunchboardModule {}
