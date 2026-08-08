import { Module } from '@nestjs/common';
import { ChargePointService } from './chargepoint.service';

@Module({ providers: [ChargePointService], exports: [ChargePointService] })
export class ChargePointModule {}
