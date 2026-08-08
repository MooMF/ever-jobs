import { Module } from '@nestjs/common';
import { AlphafmcService } from './alphafmc.service';

@Module({ providers: [AlphafmcService], exports: [AlphafmcService] })
export class AlphafmcModule {}
