import { Module } from '@nestjs/common';
import { WaymarkHealthService } from './waymark.service';

@Module({ providers: [WaymarkHealthService], exports: [WaymarkHealthService] })
export class WaymarkHealthModule {}
