import { Module } from '@nestjs/common';
import { AkkenCloudService } from './akkencloud.service';

@Module({
  providers: [AkkenCloudService],
  exports: [AkkenCloudService],
})
export class AkkenCloudModule {}
