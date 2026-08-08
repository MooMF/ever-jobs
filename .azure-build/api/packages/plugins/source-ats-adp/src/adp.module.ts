import { Module } from '@nestjs/common';
import { AdpService } from './adp.service';

@Module({
  providers: [AdpService],
  exports: [AdpService],
})
export class AdpModule {}
