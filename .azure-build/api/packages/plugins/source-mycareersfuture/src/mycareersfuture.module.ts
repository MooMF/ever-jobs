import { Module } from '@nestjs/common';
import { MycareersfutureService } from './mycareersfuture.service';

@Module({
  providers: [MycareersfutureService],
  exports: [MycareersfutureService],
})
export class MycareersfutureModule {}
