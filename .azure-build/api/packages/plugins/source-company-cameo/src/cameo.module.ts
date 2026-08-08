import { Module } from '@nestjs/common';
import { CameoService } from './cameo.service';

@Module({ providers: [CameoService], exports: [CameoService] })
export class CameoModule {}
