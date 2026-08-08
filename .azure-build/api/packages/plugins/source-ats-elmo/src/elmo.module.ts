import { Module } from '@nestjs/common';
import { ElmoService } from './elmo.service';

@Module({
  providers: [ElmoService],
  exports: [ElmoService],
})
export class ElmoModule {}
