import { Module } from '@nestjs/common';
import { BeamService } from './beam.service';

@Module({ providers: [BeamService], exports: [BeamService] })
export class BeamModule {}
