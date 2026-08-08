import { Module } from '@nestjs/common';
import { UkgService } from './ukg.service';

@Module({
  providers: [UkgService],
  exports: [UkgService],
})
export class UkgModule {}
