import { Module } from '@nestjs/common';
import { AcluService } from './aclu.service';

@Module({ providers: [AcluService], exports: [AcluService] })
export class AcluModule {}
