import { Module } from '@nestjs/common';
import { HealthjoyService } from './healthjoy.service';

@Module({ providers: [HealthjoyService], exports: [HealthjoyService] })
export class HealthjoyModule {}
