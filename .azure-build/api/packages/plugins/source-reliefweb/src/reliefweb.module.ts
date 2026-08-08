import { Module } from '@nestjs/common';
import { ReliefWebService } from './reliefweb.service';

@Module({
  providers: [ReliefWebService],
  exports: [ReliefWebService],
})
export class ReliefWebModule {}
