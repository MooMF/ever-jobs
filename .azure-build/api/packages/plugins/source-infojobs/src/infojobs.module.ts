import { Module } from '@nestjs/common';
import { InfoJobsService } from './infojobs.service';

@Module({
  providers: [InfoJobsService],
  exports: [InfoJobsService],
})
export class InfoJobsModule {}
