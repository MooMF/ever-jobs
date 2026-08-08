import { Module } from '@nestjs/common';
import { TechcareersService } from './techcareers.service';

@Module({
  providers: [TechcareersService],
  exports: [TechcareersService],
})
export class TechcareersModule {}
