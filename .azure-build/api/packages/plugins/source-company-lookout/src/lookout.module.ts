import { Module } from '@nestjs/common';
import { LookoutService } from './lookout.service';

@Module({ providers: [LookoutService], exports: [LookoutService] })
export class LookoutModule {}
