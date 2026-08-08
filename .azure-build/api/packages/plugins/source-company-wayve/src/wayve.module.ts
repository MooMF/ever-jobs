import { Module } from '@nestjs/common';
import { WayveService } from './wayve.service';

@Module({ providers: [WayveService], exports: [WayveService] })
export class WayveModule {}
