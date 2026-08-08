import { Module } from '@nestjs/common';
import { CarerixService } from './carerix.service';

@Module({
  providers: [CarerixService],
  exports: [CarerixService],
})
export class CarerixModule {}
