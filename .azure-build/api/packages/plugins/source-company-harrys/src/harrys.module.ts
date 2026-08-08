import { Module } from '@nestjs/common';
import { HarrySService } from './harrys.service';

@Module({ providers: [HarrySService], exports: [HarrySService] })
export class HarrySModule {}
