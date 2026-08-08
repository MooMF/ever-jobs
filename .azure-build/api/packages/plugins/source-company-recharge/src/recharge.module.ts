import { Module } from '@nestjs/common';
import { RechargeService } from './recharge.service';

@Module({ providers: [RechargeService], exports: [RechargeService] })
export class RechargeModule {}
