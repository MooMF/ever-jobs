import { Module } from '@nestjs/common';
import { ZenniOpticalService } from './zennioptical.service';

@Module({ providers: [ZenniOpticalService], exports: [ZenniOpticalService] })
export class ZenniOpticalModule {}
