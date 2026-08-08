import { Module } from '@nestjs/common';
import { OccupopService } from './occupop.service';

@Module({
  providers: [OccupopService],
  exports: [OccupopService],
})
export class OccupopModule {}
