import { Module } from '@nestjs/common';
import { WingService } from './wing.service';

@Module({ providers: [WingService], exports: [WingService] })
export class WingModule {}
