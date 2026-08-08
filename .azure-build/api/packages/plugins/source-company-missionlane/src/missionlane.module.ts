import { Module } from '@nestjs/common';
import { MissionLaneService } from './missionlane.service';

@Module({ providers: [MissionLaneService], exports: [MissionLaneService] })
export class MissionLaneModule {}
