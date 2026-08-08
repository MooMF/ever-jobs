import { Module } from '@nestjs/common';
import { IndeedService } from './indeed.service';

@Module({
  providers: [IndeedService],
  exports: [IndeedService],
})
export class IndeedModule {}
