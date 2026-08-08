import { Module } from '@nestjs/common';
import { NamelyService } from './namely.service';

@Module({
  providers: [NamelyService],
  exports: [NamelyService],
})
export class NamelyModule {}
