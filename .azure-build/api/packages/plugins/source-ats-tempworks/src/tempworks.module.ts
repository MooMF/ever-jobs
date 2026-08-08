import { Module } from '@nestjs/common';
import { TempWorksService } from './tempworks.service';

@Module({
  providers: [TempWorksService],
  exports: [TempWorksService],
})
export class TempWorksModule {}
