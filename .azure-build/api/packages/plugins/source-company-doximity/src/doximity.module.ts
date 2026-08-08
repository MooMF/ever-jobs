import { Module } from '@nestjs/common';
import { DoximityService } from './doximity.service';

@Module({ providers: [DoximityService], exports: [DoximityService] })
export class DoximityModule {}
