import { Module } from '@nestjs/common';
import { CareerPlugService } from './careerplug.service';

@Module({
  providers: [CareerPlugService],
  exports: [CareerPlugService],
})
export class CareerPlugModule {}
