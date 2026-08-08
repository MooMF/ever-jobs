import { Module } from '@nestjs/common';
import { HireologyService } from './hireology.service';

@Module({
  providers: [HireologyService],
  exports: [HireologyService],
})
export class HireologyModule {}
