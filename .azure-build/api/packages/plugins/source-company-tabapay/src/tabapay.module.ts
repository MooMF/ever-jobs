import { Module } from '@nestjs/common';
import { TabapayService } from './tabapay.service';

@Module({ providers: [TabapayService], exports: [TabapayService] })
export class TabapayModule {}
