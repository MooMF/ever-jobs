import { Module } from '@nestjs/common';
import { TiaService } from './tia.service';

@Module({ providers: [TiaService], exports: [TiaService] })
export class TiaModule {}
