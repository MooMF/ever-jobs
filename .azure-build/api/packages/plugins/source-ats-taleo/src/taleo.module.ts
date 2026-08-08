import { Module } from '@nestjs/common';
import { TaleoService } from './taleo.service';

@Module({
  providers: [TaleoService],
  exports: [TaleoService],
})
export class TaleoModule {}
