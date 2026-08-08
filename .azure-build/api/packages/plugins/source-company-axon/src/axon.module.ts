import { Module } from '@nestjs/common';
import { AxonService } from './axon.service';

@Module({ providers: [AxonService], exports: [AxonService] })
export class AxonModule {}
