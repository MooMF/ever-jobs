import { Module } from '@nestjs/common';
import { SimplyHiredService } from './simplyhired.service';

@Module({
  providers: [SimplyHiredService],
  exports: [SimplyHiredService],
})
export class SimplyHiredModule {}
