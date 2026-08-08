import { Module } from '@nestjs/common';
import { AestudioService } from './aestudio.service';

@Module({ providers: [AestudioService], exports: [AestudioService] })
export class AestudioModule {}
