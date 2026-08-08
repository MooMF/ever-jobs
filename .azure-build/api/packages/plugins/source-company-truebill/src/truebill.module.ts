import { Module } from '@nestjs/common';
import { RocketMoneyService } from './truebill.service';

@Module({ providers: [RocketMoneyService], exports: [RocketMoneyService] })
export class RocketMoneyModule {}
