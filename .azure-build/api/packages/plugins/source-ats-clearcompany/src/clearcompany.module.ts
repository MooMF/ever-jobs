import { Module } from '@nestjs/common';
import { ClearCompanyService } from './clearcompany.service';

@Module({
  providers: [ClearCompanyService],
  exports: [ClearCompanyService],
})
export class ClearCompanyModule {}
