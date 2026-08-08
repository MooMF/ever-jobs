import { Module } from '@nestjs/common';
import { TalenteraService } from './talentera.service';

@Module({
  providers: [TalenteraService],
  exports: [TalenteraService],
})
export class TalenteraModule {}
