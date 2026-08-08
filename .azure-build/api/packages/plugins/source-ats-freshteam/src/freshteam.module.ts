import { Module } from '@nestjs/common';
import { FreshteamService } from './freshteam.service';

@Module({
  providers: [FreshteamService],
  exports: [FreshteamService],
})
export class FreshteamModule {}
