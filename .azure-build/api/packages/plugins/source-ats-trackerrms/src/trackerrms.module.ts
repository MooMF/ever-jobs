import { Module } from '@nestjs/common';
import { TrackerRmsService } from './trackerrms.service';

@Module({
  providers: [TrackerRmsService],
  exports: [TrackerRmsService],
})
export class TrackerRmsModule {}
