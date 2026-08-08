import { Module } from '@nestjs/common';
import { ClasspassService } from './classpass.service';

@Module({ providers: [ClasspassService], exports: [ClasspassService] })
export class ClasspassModule {}
