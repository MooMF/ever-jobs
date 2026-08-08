import { Module } from '@nestjs/common';
import { CvWarehouseService } from './cvwarehouse.service';

@Module({
  providers: [CvWarehouseService],
  exports: [CvWarehouseService],
})
export class CvWarehouseModule {}
