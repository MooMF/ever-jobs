import { Module } from '@nestjs/common';
import { SuitsupplyService } from './suitsupply.service';

@Module({ providers: [SuitsupplyService], exports: [SuitsupplyService] })
export class SuitsupplyModule {}
