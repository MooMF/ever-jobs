import { Module } from '@nestjs/common';
import { IosdevjobsService } from './iosdevjobs.service';

@Module({
  providers: [IosdevjobsService],
  exports: [IosdevjobsService],
})
export class IosdevjobsModule {}
