import { Module } from '@nestjs/common';
import { AvionteService } from './avionte.service';

@Module({
  providers: [AvionteService],
  exports: [AvionteService],
})
export class AvionteModule {}
