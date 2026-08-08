import { Module } from '@nestjs/common';
import { CoroflotService } from './coroflot.service';

@Module({
  providers: [CoroflotService],
  exports: [CoroflotService],
})
export class CoroflotModule {}
