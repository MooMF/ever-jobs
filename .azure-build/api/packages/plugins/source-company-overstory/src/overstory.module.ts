import { Module } from '@nestjs/common';
import { OverstoryService } from './overstory.service';

@Module({ providers: [OverstoryService], exports: [OverstoryService] })
export class OverstoryModule {}
