import { Module } from '@nestjs/common';
import { KairospowerService } from './kairospower.service';

@Module({ providers: [KairospowerService], exports: [KairospowerService] })
export class KairospowerModule {}
