import { Module } from '@nestjs/common';
import { StabilityaiService } from './stabilityai.service';

@Module({ providers: [StabilityaiService], exports: [StabilityaiService] })
export class StabilityaiModule {}
