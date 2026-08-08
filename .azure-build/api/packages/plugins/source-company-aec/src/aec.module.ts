import { Module } from '@nestjs/common';
import { AecService } from './aec.service';

@Module({ providers: [AecService], exports: [AecService] })
export class AecModule {}
