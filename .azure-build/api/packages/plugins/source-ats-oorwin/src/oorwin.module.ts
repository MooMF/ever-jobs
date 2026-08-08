import { Module } from '@nestjs/common';
import { OorwinService } from './oorwin.service';

@Module({
  providers: [OorwinService],
  exports: [OorwinService],
})
export class OorwinModule {}
