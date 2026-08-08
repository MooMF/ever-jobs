import { Module } from '@nestjs/common';
import { AgwestfarmcreditService } from './agwestfarmcredit.service';

@Module({ providers: [AgwestfarmcreditService], exports: [AgwestfarmcreditService] })
export class AgwestfarmcreditModule {}
