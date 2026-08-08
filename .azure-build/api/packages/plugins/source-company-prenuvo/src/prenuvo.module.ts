import { Module } from '@nestjs/common';
import { PrenuvoService } from './prenuvo.service';

@Module({ providers: [PrenuvoService], exports: [PrenuvoService] })
export class PrenuvoModule {}
