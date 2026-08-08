import { Module } from '@nestjs/common';
import { EzraService } from './ezra.service';

@Module({ providers: [EzraService], exports: [EzraService] })
export class EzraModule {}
