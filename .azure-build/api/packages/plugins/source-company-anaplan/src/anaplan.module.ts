import { Module } from '@nestjs/common';
import { AnaplanService } from './anaplan.service';

@Module({ providers: [AnaplanService], exports: [AnaplanService] })
export class AnaplanModule {}
