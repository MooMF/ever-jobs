import { Module } from '@nestjs/common';
import { NubankService } from './nubank.service';

@Module({ providers: [NubankService], exports: [NubankService] })
export class NubankModule {}
