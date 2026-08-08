import { Module } from '@nestjs/common';
import { CeipalService } from './ceipal.service';

@Module({
  providers: [CeipalService],
  exports: [CeipalService],
})
export class CeipalModule {}
