import { Module } from '@nestjs/common';
import { QphoXService } from './qphox.service';

@Module({ providers: [QphoXService], exports: [QphoXService] })
export class QphoXModule {}
