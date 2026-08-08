import { Module } from '@nestjs/common';
import { RitualService } from './ritual.service';

@Module({ providers: [RitualService], exports: [RitualService] })
export class RitualModule {}
