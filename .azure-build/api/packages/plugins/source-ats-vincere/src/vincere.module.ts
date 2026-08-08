import { Module } from '@nestjs/common';
import { VincereService } from './vincere.service';

@Module({
  providers: [VincereService],
  exports: [VincereService],
})
export class VincereModule {}
