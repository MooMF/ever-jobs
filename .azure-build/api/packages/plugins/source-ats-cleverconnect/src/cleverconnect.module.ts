import { Module } from '@nestjs/common';
import { CleverConnectService } from './cleverconnect.service';

@Module({
  providers: [CleverConnectService],
  exports: [CleverConnectService],
})
export class CleverConnectModule {}
