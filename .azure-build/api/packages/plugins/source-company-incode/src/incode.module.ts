import { Module } from '@nestjs/common';
import { IncodeTechnologiesService } from './incode.service';

@Module({ providers: [IncodeTechnologiesService], exports: [IncodeTechnologiesService] })
export class IncodeTechnologiesModule {}
