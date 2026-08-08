import { Module } from '@nestjs/common';
import { ElixirJobsService } from './elixirjobs.service';

@Module({
  providers: [ElixirJobsService],
  exports: [ElixirJobsService],
})
export class ElixirJobsModule {}
