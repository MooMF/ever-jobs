import { Module } from '@nestjs/common';
import { GrowwService } from './groww.service';

@Module({ providers: [GrowwService], exports: [GrowwService] })
export class GrowwModule {}
