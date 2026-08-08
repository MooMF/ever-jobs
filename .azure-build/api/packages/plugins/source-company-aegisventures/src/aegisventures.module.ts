import { Module } from '@nestjs/common';
import { AegisventuresService } from './aegisventures.service';

@Module({ providers: [AegisventuresService], exports: [AegisventuresService] })
export class AegisventuresModule {}
