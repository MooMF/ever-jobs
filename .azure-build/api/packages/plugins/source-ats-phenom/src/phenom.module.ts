import { Module } from '@nestjs/common';
import { PhenomService } from './phenom.service';

@Module({
  providers: [PhenomService],
  exports: [PhenomService],
})
export class PhenomModule {}
