import { Module } from '@nestjs/common';
import { EthosService } from './ethos.service';

@Module({ providers: [EthosService], exports: [EthosService] })
export class EthosModule {}
