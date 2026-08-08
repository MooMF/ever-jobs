import { Module } from '@nestjs/common';
import { EthosLifeService } from './ethoslife.service';

@Module({ providers: [EthosLifeService], exports: [EthosLifeService] })
export class EthosLifeModule {}
