import { Module } from '@nestjs/common';
import { JobspressoService } from './jobspresso.service';

@Module({
  providers: [JobspressoService],
  exports: [JobspressoService],
})
export class JobspressoModule {}
