import { Module } from '@nestjs/common';
import { ParachuteHomeService } from './parachutehome.service';

@Module({ providers: [ParachuteHomeService], exports: [ParachuteHomeService] })
export class ParachuteHomeModule {}
