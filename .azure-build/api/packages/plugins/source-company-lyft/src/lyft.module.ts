import { Module } from '@nestjs/common';
import { LyftService } from './lyft.service';

@Module({ providers: [LyftService], exports: [LyftService] })
export class LyftModule {}
