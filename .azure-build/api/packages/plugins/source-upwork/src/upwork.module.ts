import { Module } from '@nestjs/common';
import { UpworkService } from './upwork.service';

@Module({
  providers: [UpworkService],
  exports: [UpworkService],
})
export class UpworkModule {}
