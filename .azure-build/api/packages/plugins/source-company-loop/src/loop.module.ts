import { Module } from '@nestjs/common';
import { LoopService } from './loop.service';

@Module({ providers: [LoopService], exports: [LoopService] })
export class LoopModule {}
