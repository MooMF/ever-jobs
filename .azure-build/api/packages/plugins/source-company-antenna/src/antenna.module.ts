import { Module } from '@nestjs/common';
import { AntennaService } from './antenna.service';

@Module({ providers: [AntennaService], exports: [AntennaService] })
export class AntennaModule {}
