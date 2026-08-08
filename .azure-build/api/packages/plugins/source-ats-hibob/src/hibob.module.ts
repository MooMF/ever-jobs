import { Module } from '@nestjs/common';
import { HiBobService } from './hibob.service';

@Module({
  providers: [HiBobService],
  exports: [HiBobService],
})
export class HiBobModule {}
