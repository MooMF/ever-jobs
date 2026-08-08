import { Module } from '@nestjs/common';
import { AltService } from './alt.service';

@Module({ providers: [AltService], exports: [AltService] })
export class AltModule {}
