import { Module } from '@nestjs/common';
import { AcademiccareersService } from './academiccareers.service';

@Module({
  providers: [AcademiccareersService],
  exports: [AcademiccareersService],
})
export class AcademiccareersModule {}
