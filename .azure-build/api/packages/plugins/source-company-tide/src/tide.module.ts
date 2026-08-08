import { Module } from '@nestjs/common';
import { TideService } from './tide.service';

@Module({ providers: [TideService], exports: [TideService] })
export class TideModule {}
