import { Module } from '@nestjs/common';
import { RecootyService } from './recooty.service';

@Module({
  providers: [RecootyService],
  exports: [RecootyService],
})
export class RecootyModule {}
