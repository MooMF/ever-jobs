import { Module } from '@nestjs/common';
import { AdelphiresearchService } from './adelphiresearch.service';

@Module({ providers: [AdelphiresearchService], exports: [AdelphiresearchService] })
export class AdelphiresearchModule {}
