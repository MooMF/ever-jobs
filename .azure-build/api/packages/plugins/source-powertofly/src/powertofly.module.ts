import { Module } from '@nestjs/common';
import { PowertoflyService } from './powertofly.service';

@Module({
  providers: [PowertoflyService],
  exports: [PowertoflyService],
})
export class PowertoflyModule {}
