import { Module } from '@nestjs/common';
import { RocketLabService } from './rocketlab.service';

@Module({ providers: [RocketLabService], exports: [RocketLabService] })
export class RocketLabModule {}
