import { Module } from '@nestjs/common';
import { TuringService } from './turing.service';

@Module({ providers: [TuringService], exports: [TuringService] })
export class TuringModule {}
