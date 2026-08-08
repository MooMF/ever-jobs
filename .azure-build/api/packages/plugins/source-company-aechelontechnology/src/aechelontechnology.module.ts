import { Module } from '@nestjs/common';
import { AechelontechnologyService } from './aechelontechnology.service';

@Module({ providers: [AechelontechnologyService], exports: [AechelontechnologyService] })
export class AechelontechnologyModule {}
