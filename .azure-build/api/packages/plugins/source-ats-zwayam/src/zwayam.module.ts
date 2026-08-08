import { Module } from '@nestjs/common';
import { ZwayamService } from './zwayam.service';

@Module({
  providers: [ZwayamService],
  exports: [ZwayamService],
})
export class ZwayamModule {}
