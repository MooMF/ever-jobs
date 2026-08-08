import { Module } from '@nestjs/common';
import { GermantechjobsService } from './germantechjobs.service';

@Module({
  providers: [GermantechjobsService],
  exports: [GermantechjobsService],
})
export class GermantechjobsModule {}
