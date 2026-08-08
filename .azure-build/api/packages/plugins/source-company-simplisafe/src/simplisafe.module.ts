import { Module } from '@nestjs/common';
import { SimplisafeService } from './simplisafe.service';

@Module({ providers: [SimplisafeService], exports: [SimplisafeService] })
export class SimplisafeModule {}
