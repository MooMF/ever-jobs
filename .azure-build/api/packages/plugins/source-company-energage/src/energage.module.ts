import { Module } from '@nestjs/common';
import { EnergageService } from './energage.service';

@Module({ providers: [EnergageService], exports: [EnergageService] })
export class EnergageModule {}
