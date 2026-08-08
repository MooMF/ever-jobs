import { Module } from '@nestjs/common';
import { GoHireService } from './gohire.service';

@Module({
  providers: [GoHireService],
  exports: [GoHireService],
})
export class GoHireModule {}
