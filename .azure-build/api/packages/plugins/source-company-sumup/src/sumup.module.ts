import { Module } from '@nestjs/common';
import { SumUpService } from './sumup.service';

@Module({ providers: [SumUpService], exports: [SumUpService] })
export class SumUpModule {}
