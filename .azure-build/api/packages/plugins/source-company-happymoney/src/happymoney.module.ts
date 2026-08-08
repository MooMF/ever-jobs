import { Module } from '@nestjs/common';
import { HappyMoneyService } from './happymoney.service';

@Module({ providers: [HappyMoneyService], exports: [HappyMoneyService] })
export class HappyMoneyModule {}
