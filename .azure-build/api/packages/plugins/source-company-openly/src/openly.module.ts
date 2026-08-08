import { Module } from '@nestjs/common';
import { OpenlyService } from './openly.service';

@Module({ providers: [OpenlyService], exports: [OpenlyService] })
export class OpenlyModule {}
