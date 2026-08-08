import { Module } from '@nestjs/common';
import { SweetgreenService } from './sweetgreen.service';

@Module({ providers: [SweetgreenService], exports: [SweetgreenService] })
export class SweetgreenModule {}
