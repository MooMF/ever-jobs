import { Module } from '@nestjs/common';
import { IsolvedService } from './isolved.service';

@Module({
  providers: [IsolvedService],
  exports: [IsolvedService],
})
export class IsolvedModule {}
