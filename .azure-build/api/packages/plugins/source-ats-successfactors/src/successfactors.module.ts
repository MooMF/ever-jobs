import { Module } from '@nestjs/common';
import { SuccessFactorsService } from './successfactors.service';

@Module({
  providers: [SuccessFactorsService],
  exports: [SuccessFactorsService],
})
export class SuccessFactorsModule {}
