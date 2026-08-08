import { Module } from '@nestjs/common';
import { StitchfixService } from './stitchfix.service';

@Module({ providers: [StitchfixService], exports: [StitchfixService] })
export class StitchfixModule {}
