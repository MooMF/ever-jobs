import { Module } from '@nestjs/common';
import { ObserveaiService } from './observeai.service';

@Module({ providers: [ObserveaiService], exports: [ObserveaiService] })
export class ObserveaiModule {}
