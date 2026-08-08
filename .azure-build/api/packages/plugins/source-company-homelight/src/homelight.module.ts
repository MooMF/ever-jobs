import { Module } from '@nestjs/common';
import { HomeLightService } from './homelight.service';

@Module({ providers: [HomeLightService], exports: [HomeLightService] })
export class HomeLightModule {}
