import { Module } from '@nestjs/common';
import { ExactHireService } from './exacthire.service';

@Module({
  providers: [ExactHireService],
  exports: [ExactHireService],
})
export class ExactHireModule {}
