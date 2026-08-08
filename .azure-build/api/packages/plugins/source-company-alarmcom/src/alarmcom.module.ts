import { Module } from '@nestjs/common';
import { AlarmcomService } from './alarmcom.service';

@Module({ providers: [AlarmcomService], exports: [AlarmcomService] })
export class AlarmcomModule {}
