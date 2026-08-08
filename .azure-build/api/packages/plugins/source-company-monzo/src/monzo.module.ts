import { Module } from '@nestjs/common';
import { MonzoService } from './monzo.service';

@Module({ providers: [MonzoService], exports: [MonzoService] })
export class MonzoModule {}
