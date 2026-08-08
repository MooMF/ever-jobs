import { Module } from '@nestjs/common';
import { AlliancedefendingfreedomService } from './alliancedefendingfreedom.service';

@Module({ providers: [AlliancedefendingfreedomService], exports: [AlliancedefendingfreedomService] })
export class AlliancedefendingfreedomModule {}
