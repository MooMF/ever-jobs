import { Module } from '@nestjs/common';
import { RuggableService } from './ruggable.service';

@Module({ providers: [RuggableService], exports: [RuggableService] })
export class RuggableModule {}
