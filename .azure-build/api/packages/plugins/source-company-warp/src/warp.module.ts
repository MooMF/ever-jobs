import { Module } from '@nestjs/common';
import { WarpService } from './warp.service';

@Module({ providers: [WarpService], exports: [WarpService] })
export class WarpModule {}
