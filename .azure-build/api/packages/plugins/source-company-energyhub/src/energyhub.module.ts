import { Module } from '@nestjs/common';
import { EnergyHubService } from './energyhub.service';

@Module({ providers: [EnergyHubService], exports: [EnergyHubService] })
export class EnergyHubModule {}
