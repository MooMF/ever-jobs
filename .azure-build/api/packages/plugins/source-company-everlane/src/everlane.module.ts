import { Module } from '@nestjs/common';
import { EverlaneService } from './everlane.service';

@Module({ providers: [EverlaneService], exports: [EverlaneService] })
export class EverlaneModule {}
