import { Module } from '@nestjs/common';
import { EpicgamesService } from './epicgames.service';

@Module({ providers: [EpicgamesService], exports: [EpicgamesService] })
export class EpicgamesModule {}
