import { Module } from '@nestjs/common';
import { AninebingService } from './aninebing.service';

@Module({ providers: [AninebingService], exports: [AninebingService] })
export class AninebingModule {}
