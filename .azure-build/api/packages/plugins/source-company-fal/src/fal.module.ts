import { Module } from '@nestjs/common';
import { FalService } from './fal.service';

@Module({ providers: [FalService], exports: [FalService] })
export class FalModule {}
