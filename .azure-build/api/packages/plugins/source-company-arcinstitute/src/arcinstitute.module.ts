import { Module } from '@nestjs/common';
import { ArcInstituteService } from './arcinstitute.service';

@Module({ providers: [ArcInstituteService], exports: [ArcInstituteService] })
export class ArcInstituteModule {}
