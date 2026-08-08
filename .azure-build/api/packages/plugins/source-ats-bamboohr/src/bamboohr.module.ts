import { Module } from '@nestjs/common';
import { BambooHRService } from './bamboohr.service';

@Module({
  providers: [BambooHRService],
  exports: [BambooHRService],
})
export class BambooHRModule {}
