import { Module } from '@nestjs/common';
import { MotiveService } from './motive.service';

@Module({ providers: [MotiveService], exports: [MotiveService] })
export class MotiveModule {}
