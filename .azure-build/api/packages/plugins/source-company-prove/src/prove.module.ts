import { Module } from '@nestjs/common';
import { ProveService } from './prove.service';

@Module({ providers: [ProveService], exports: [ProveService] })
export class ProveModule {}
