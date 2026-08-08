import { Module } from '@nestjs/common';
import { VeriffService } from './veriff.service';

@Module({ providers: [VeriffService], exports: [VeriffService] })
export class VeriffModule {}
