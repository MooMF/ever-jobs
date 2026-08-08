import { Module } from '@nestjs/common';
import { EmploymentHeroService } from './employmenthero.service';

@Module({
  providers: [EmploymentHeroService],
  exports: [EmploymentHeroService],
})
export class EmploymentHeroModule {}
