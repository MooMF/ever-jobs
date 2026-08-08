import { Module } from '@nestjs/common';
import { ExtendService } from './extend.service';

@Module({ providers: [ExtendService], exports: [ExtendService] })
export class ExtendModule {}
