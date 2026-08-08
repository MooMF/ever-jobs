import { Module } from '@nestjs/common';
import { CareerBuilderService } from './careerbuilder.service';

@Module({
  providers: [CareerBuilderService],
  exports: [CareerBuilderService],
})
export class CareerBuilderModule {}
