import { Module } from '@nestjs/common';
import { OctaveService } from './octave.service';

@Module({ providers: [OctaveService], exports: [OctaveService] })
export class OctaveModule {}
