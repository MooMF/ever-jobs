import { Module } from '@nestjs/common';
import { FanDuelService } from './fanduel.service';

@Module({ providers: [FanDuelService], exports: [FanDuelService] })
export class FanDuelModule {}
