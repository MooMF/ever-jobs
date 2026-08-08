import { Module } from '@nestjs/common';
import { BettermentService } from './betterment.service';

@Module({ providers: [BettermentService], exports: [BettermentService] })
export class BettermentModule {}
