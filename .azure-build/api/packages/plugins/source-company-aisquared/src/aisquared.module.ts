import { Module } from '@nestjs/common';
import { AisquaredService } from './aisquared.service';

@Module({ providers: [AisquaredService], exports: [AisquaredService] })
export class AisquaredModule {}
