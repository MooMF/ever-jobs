import { Module } from '@nestjs/common';
import { RadancyService } from './radancy.service';

@Module({
  providers: [RadancyService],
  exports: [RadancyService],
})
export class RadancyModule {}
