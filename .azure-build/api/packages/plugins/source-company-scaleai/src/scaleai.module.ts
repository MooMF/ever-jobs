import { Module } from '@nestjs/common';
import { ScaleaiService } from './scaleai.service';

@Module({ providers: [ScaleaiService], exports: [ScaleaiService] })
export class ScaleaiModule {}
