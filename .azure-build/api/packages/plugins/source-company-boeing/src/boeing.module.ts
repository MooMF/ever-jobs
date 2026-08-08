import { Module } from '@nestjs/common';
import { BoeingService } from './boeing.service';

@Module({ providers: [BoeingService], exports: [BoeingService] })
export class BoeingModule {}
