import { Module } from '@nestjs/common';
import { DivergentService } from './divergent.service';

@Module({ providers: [DivergentService], exports: [DivergentService] })
export class DivergentModule {}
