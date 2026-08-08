import { Module } from '@nestjs/common';
import { PageUpService } from './pageup.service';

@Module({
  providers: [PageUpService],
  exports: [PageUpService],
})
export class PageUpModule {}
