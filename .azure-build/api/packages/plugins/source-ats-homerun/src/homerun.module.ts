import { Module } from '@nestjs/common';
import { HomerunService } from './homerun.service';

@Module({
  providers: [HomerunService],
  exports: [HomerunService],
})
export class HomerunModule {}
