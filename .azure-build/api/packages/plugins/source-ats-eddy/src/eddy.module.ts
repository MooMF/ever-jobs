import { Module } from '@nestjs/common';
import { EddyService } from './eddy.service';

@Module({
  providers: [EddyService],
  exports: [EddyService],
})
export class EddyModule {}
