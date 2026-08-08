import { Module } from '@nestjs/common';
import { WellfoundService } from './wellfound.service';

@Module({
  providers: [WellfoundService],
  exports: [WellfoundService],
})
export class WellfoundModule {}
