import { Module } from '@nestjs/common';
import { JazzHRService } from './jazzhr.service';

@Module({
  providers: [JazzHRService],
  exports: [JazzHRService],
})
export class JazzHRModule {}
