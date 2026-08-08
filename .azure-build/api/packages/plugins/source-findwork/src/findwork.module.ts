import { Module } from '@nestjs/common';
import { FindWorkService } from './findwork.service';

@Module({
  providers: [FindWorkService],
  exports: [FindWorkService],
})
export class FindWorkModule {}
