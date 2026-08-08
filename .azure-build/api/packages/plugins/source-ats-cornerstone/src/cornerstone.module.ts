import { Module } from '@nestjs/common';
import { CornerstoneService } from './cornerstone.service';

@Module({
  providers: [CornerstoneService],
  exports: [CornerstoneService],
})
export class CornerstoneModule {}
