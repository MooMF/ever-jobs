import { Module } from '@nestjs/common';
import { SubscribeHrService } from './subscribehr.service';

@Module({
  providers: [SubscribeHrService],
  exports: [SubscribeHrService],
})
export class SubscribeHrModule {}
