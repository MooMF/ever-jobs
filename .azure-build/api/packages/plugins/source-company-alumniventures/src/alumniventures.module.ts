import { Module } from '@nestjs/common';
import { AlumniventuresService } from './alumniventures.service';

@Module({ providers: [AlumniventuresService], exports: [AlumniventuresService] })
export class AlumniventuresModule {}
