import { Module } from '@nestjs/common';
import { AhrefsjobsService } from './ahrefsjobs.service';

@Module({ providers: [AhrefsjobsService], exports: [AhrefsjobsService] })
export class AhrefsjobsModule {}
