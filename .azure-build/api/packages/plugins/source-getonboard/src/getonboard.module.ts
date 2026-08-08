import { Module } from '@nestjs/common';
import { GetOnBoardService } from './getonboard.service';

@Module({
  providers: [GetOnBoardService],
  exports: [GetOnBoardService],
})
export class GetOnBoardModule {}
