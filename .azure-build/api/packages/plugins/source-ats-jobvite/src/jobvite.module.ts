import { Module } from '@nestjs/common';
import { JobviteService } from './jobvite.service';

@Module({
  providers: [JobviteService],
  exports: [JobviteService],
})
export class JobviteModule {}
