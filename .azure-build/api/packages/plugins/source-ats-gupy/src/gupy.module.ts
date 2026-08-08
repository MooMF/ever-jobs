import { Module } from '@nestjs/common';
import { GupyService } from './gupy.service';

@Module({
  providers: [GupyService],
  exports: [GupyService],
})
export class GupyModule {}
