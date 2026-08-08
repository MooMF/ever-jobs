import { Module } from '@nestjs/common';
import { EcojobsService } from './ecojobs.service';

@Module({
  providers: [EcojobsService],
  exports: [EcojobsService],
})
export class EcojobsModule {}
