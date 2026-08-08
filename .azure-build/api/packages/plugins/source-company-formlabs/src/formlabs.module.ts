import { Module } from '@nestjs/common';
import { FormlabsService } from './formlabs.service';

@Module({ providers: [FormlabsService], exports: [FormlabsService] })
export class FormlabsModule {}
