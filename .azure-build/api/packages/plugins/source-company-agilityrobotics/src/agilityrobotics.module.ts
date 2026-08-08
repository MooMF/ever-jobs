import { Module } from '@nestjs/common';
import { AgilityRoboticsService } from './agilityrobotics.service';

@Module({ providers: [AgilityRoboticsService], exports: [AgilityRoboticsService] })
export class AgilityRoboticsModule {}
