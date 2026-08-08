import { Module } from '@nestjs/common';
import { TeamdashService } from './teamdash.service';

@Module({
  providers: [TeamdashService],
  exports: [TeamdashService],
})
export class TeamdashModule {}
