import { Module } from '@nestjs/common';
import { SnaphuntService } from './snaphunt.service';

@Module({
  providers: [SnaphuntService],
  exports: [SnaphuntService],
})
export class SnaphuntModule {}
