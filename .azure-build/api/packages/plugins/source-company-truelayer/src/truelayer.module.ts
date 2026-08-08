import { Module } from '@nestjs/common';
import { TruelayerService } from './truelayer.service';

@Module({ providers: [TruelayerService], exports: [TruelayerService] })
export class TruelayerModule {}
