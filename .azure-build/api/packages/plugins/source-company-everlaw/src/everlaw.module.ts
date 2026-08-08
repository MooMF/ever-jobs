import { Module } from '@nestjs/common';
import { EverlawService } from './everlaw.service';

@Module({ providers: [EverlawService], exports: [EverlawService] })
export class EverlawModule {}
