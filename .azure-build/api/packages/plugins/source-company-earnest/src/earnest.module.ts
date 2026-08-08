import { Module } from '@nestjs/common';
import { EarnestService } from './earnest.service';

@Module({ providers: [EarnestService], exports: [EarnestService] })
export class EarnestModule {}
