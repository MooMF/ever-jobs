import { Module } from '@nestjs/common';
import { MindscopeService } from './mindscope.service';

@Module({
  providers: [MindscopeService],
  exports: [MindscopeService],
})
export class MindscopeModule {}
