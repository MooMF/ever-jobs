import { Module } from '@nestjs/common';
import { WaymoService } from './waymo.service';

@Module({ providers: [WaymoService], exports: [WaymoService] })
export class WaymoModule {}
