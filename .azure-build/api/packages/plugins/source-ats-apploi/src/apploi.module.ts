import { Module } from '@nestjs/common';
import { ApploiService } from './apploi.service';

@Module({
  providers: [ApploiService],
  exports: [ApploiService],
})
export class ApploiModule {}
