import { Module } from '@nestjs/common';
import { RiotgamesService } from './riotgames.service';

@Module({ providers: [RiotgamesService], exports: [RiotgamesService] })
export class RiotgamesModule {}
