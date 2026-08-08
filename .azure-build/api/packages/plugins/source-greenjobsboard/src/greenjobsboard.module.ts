import { Module } from '@nestjs/common';
import { GreenJobsBoardService } from './greenjobsboard.service';

@Module({
  providers: [GreenJobsBoardService],
  exports: [GreenJobsBoardService],
})
export class GreenJobsBoardModule {}
