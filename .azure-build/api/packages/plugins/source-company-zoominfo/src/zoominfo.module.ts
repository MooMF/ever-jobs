import { Module } from '@nestjs/common';
import { ZoomInfoService } from './zoominfo.service';

@Module({ providers: [ZoomInfoService], exports: [ZoomInfoService] })
export class ZoomInfoModule {}
