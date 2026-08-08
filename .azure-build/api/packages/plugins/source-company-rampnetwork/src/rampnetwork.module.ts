import { Module } from '@nestjs/common';
import { RampNetworkService } from './rampnetwork.service';

@Module({ providers: [RampNetworkService], exports: [RampNetworkService] })
export class RampNetworkModule {}
