import { Module } from '@nestjs/common';
import { JoinRiseService } from './joinrise.service';

@Module({
  providers: [JoinRiseService],
  exports: [JoinRiseService],
})
export class JoinRiseModule {}
