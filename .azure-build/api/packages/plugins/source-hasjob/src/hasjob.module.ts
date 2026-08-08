import { Module } from '@nestjs/common';
import { HasJobService } from './hasjob.service';

@Module({
  providers: [HasJobService],
  exports: [HasJobService],
})
export class HasJobModule {}
