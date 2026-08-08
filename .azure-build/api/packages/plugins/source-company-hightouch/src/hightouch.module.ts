import { Module } from '@nestjs/common';
import { HightouchService } from './hightouch.service';

@Module({ providers: [HightouchService], exports: [HightouchService] })
export class HightouchModule {}
