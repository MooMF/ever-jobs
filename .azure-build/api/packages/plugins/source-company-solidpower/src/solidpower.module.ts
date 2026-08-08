import { Module } from '@nestjs/common';
import { SolidPowerService } from './solidpower.service';

@Module({ providers: [SolidPowerService], exports: [SolidPowerService] })
export class SolidPowerModule {}
