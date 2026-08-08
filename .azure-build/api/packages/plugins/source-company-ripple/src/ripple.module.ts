import { Module } from '@nestjs/common';
import { RippleService } from './ripple.service';

@Module({ providers: [RippleService], exports: [RippleService] })
export class RippleModule {}
