import { Module } from '@nestjs/common';
import { FreenomeService } from './freenome.service';

@Module({ providers: [FreenomeService], exports: [FreenomeService] })
export class FreenomeModule {}
