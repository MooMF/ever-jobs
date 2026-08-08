import { Module } from '@nestjs/common';
import { AirspaceService } from './airspace.service';

@Module({ providers: [AirspaceService], exports: [AirspaceService] })
export class AirspaceModule {}
