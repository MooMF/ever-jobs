import { Module } from '@nestjs/common';
import { TurboHireService } from './turbohire.service';

@Module({
  providers: [TurboHireService],
  exports: [TurboHireService],
})
export class TurboHireModule {}
