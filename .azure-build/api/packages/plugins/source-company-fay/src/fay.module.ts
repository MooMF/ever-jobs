import { Module } from '@nestjs/common';
import { FayService } from './fay.service';

@Module({ providers: [FayService], exports: [FayService] })
export class FayModule {}
