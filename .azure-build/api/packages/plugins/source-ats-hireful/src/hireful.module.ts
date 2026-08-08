import { Module } from '@nestjs/common';
import { HirefulService } from './hireful.service';

@Module({
  providers: [HirefulService],
  exports: [HirefulService],
})
export class HirefulModule {}
