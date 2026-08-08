import { Module } from '@nestjs/common';
import { OpensourcedesignjobsService } from './opensourcedesignjobs.service';

@Module({
  providers: [OpensourcedesignjobsService],
  exports: [OpensourcedesignjobsService],
})
export class OpensourcedesignjobsModule {}
