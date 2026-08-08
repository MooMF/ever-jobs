import { Module } from '@nestjs/common';
import { ApparatusService } from './apparatus.service';

@Module({ providers: [ApparatusService], exports: [ApparatusService] })
export class ApparatusModule {}
