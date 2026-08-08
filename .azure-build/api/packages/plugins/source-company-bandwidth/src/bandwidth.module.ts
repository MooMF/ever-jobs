import { Module } from '@nestjs/common';
import { BandwidthService } from './bandwidth.service';

@Module({ providers: [BandwidthService], exports: [BandwidthService] })
export class BandwidthModule {}
