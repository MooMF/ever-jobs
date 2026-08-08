import { Module } from '@nestjs/common';
import { CrelateService } from './crelate.service';

@Module({
  providers: [CrelateService],
  exports: [CrelateService],
})
export class CrelateModule {}
