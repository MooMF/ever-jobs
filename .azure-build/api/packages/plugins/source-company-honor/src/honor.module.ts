import { Module } from '@nestjs/common';
import { HonorService } from './honor.service';

@Module({ providers: [HonorService], exports: [HonorService] })
export class HonorModule {}
