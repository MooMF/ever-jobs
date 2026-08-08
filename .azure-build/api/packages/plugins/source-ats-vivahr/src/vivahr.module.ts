import { Module } from '@nestjs/common';
import { VivaHRService } from './vivahr.service';

@Module({
  providers: [VivaHRService],
  exports: [VivaHRService],
})
export class VivaHRModule {}
