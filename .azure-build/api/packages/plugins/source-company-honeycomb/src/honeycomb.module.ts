import { Module } from '@nestjs/common';
import { HoneycombService } from './honeycomb.service';

@Module({ providers: [HoneycombService], exports: [HoneycombService] })
export class HoneycombModule {}
