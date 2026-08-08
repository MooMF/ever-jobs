import { Module } from '@nestjs/common';
import { GreytHrService } from './greythr.service';

@Module({
  providers: [GreytHrService],
  exports: [GreytHrService],
})
export class GreytHrModule {}
