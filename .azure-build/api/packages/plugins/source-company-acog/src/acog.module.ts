import { Module } from '@nestjs/common';
import { AcogService } from './acog.service';

@Module({ providers: [AcogService], exports: [AcogService] })
export class AcogModule {}
